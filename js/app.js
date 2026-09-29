/*
=========================================================
SHRIKAR READING COMPREHENSION
VERSION 2.0
=========================================================

PURPOSE

1. Load CleanBookData.json from the OCR Extractor.
2. Preserve source-page order.
3. Ignore pages marked "No Story Text".
4. Combine the parent-approved text.
5. Split the clean text into story sentences.
6. Present three sentences at a time.
7. Move forward ONE sentence at a time.

Example:

Screen 1 = sentences 1, 2, 3
Screen 2 = sentences 2, 3, 4
Screen 3 = sentences 3, 4, 5

This intentionally creates repeated exposure.

=========================================================
*/


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const uploadScreen =
    document.getElementById("uploadScreen");

const bookReadyScreen =
    document.getElementById("bookReadyScreen");

const readingScreen =
    document.getElementById("readingScreen");

const completeScreen =
    document.getElementById("completeScreen");


const bookFileInput =
    document.getElementById("bookFileInput");

const selectedFileName =
    document.getElementById("selectedFileName");

const loadBookButton =
    document.getElementById("loadBookButton");

const uploadError =
    document.getElementById("uploadError");


const bookName =
    document.getElementById("bookName");

const sentenceCount =
    document.getElementById("sentenceCount");

const sourcePageCount =
    document.getElementById("sourcePageCount");

const startReadingButton =
    document.getElementById("startReadingButton");


const readingBookName =
    document.getElementById("readingBookName");

const progressText =
    document.getElementById("progressText");

const progressBar =
    document.getElementById("progressBar");

const sentenceContainer =
    document.getElementById("sentenceContainer");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");


const readAgainButton =
    document.getElementById("readAgainButton");

const newBookButton =
    document.getElementById("newBookButton");


/* =====================================================
   APPLICATION STATE
   ===================================================== */

let selectedFile = null;

let loadedBook = null;

let storySentences = [];

/*
currentWindowStart uses a zero-based array position.

0 = sentences 1, 2, 3
1 = sentences 2, 3, 4
2 = sentences 3, 4, 5
*/

let currentWindowStart = 0;


/* =====================================================
   FILE SELECTION
   ===================================================== */

bookFileInput.addEventListener(
    "change",
    event => {

        hideUploadError();

        const file =
            event.target.files[0];


        if (!file) {

            selectedFile = null;

            selectedFileName.textContent =
                "No book selected";

            loadBookButton.disabled =
                true;

            return;
        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".json")
        ) {

            selectedFile = null;

            selectedFileName.textContent =
                "Invalid file";

            loadBookButton.disabled =
                true;

            showUploadError(
                "Please choose the Book Data JSON file created by the OCR Extractor."
            );

            return;
        }


        selectedFile = file;

        selectedFileName.textContent =
            file.name;

        loadBookButton.disabled =
            false;
    }
);


/* =====================================================
   LOAD BOOK
   ===================================================== */

loadBookButton.addEventListener(
    "click",
    async () => {

        if (!selectedFile) {
            return;
        }


        hideUploadError();

        loadBookButton.disabled =
            true;

        loadBookButton.textContent =
            "Loading Story...";


        try {

            const rawText =
                await selectedFile.text();


            const bookData =
                JSON.parse(rawText);


            validateBookData(
                bookData
            );


            loadedBook =
                bookData;


            storySentences =
                buildStorySentences(
                    bookData
                );


            if (
                storySentences.length < 3
            ) {

                throw new Error(
                    "This book does not contain enough story sentences. At least three sentences are needed."
                );

            }


            currentWindowStart =
                0;


            prepareBookReadyScreen();

            showScreen(
                bookReadyScreen
            );

        }
        catch (error) {

            console.error(error);

            showUploadError(
                "I could not prepare this book. " +
                error.message
            );

        }
        finally {

            loadBookButton.disabled =
                false;

            loadBookButton.textContent =
                "Load My Story";

        }

    }
);


/* =====================================================
   VALIDATE OCR EXTRACTOR FILE
   ===================================================== */

function validateBookData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "The selected file does not contain valid book data."
        );

    }


    if (
        data.format !==
        "ShrikarBookOCR"
    ) {

        throw new Error(
            "This does not appear to be a Shrikar Book OCR file."
        );

    }


    if (
        !Array.isArray(data.pages)
    ) {

        throw new Error(
            "The book file does not contain page information."
        );

    }


    if (
        data.pages.length === 0
    ) {

        throw new Error(
            "The book contains no pages."
        );

    }

}


/* =====================================================
   BUILD STORY SENTENCES
   ===================================================== */

function buildStorySentences(bookData) {

    /*
    First sort pages according to the original
    source PDF page number.
    */

    const orderedPages =
        [...bookData.pages]
            .sort(
                (a, b) =>
                    Number(a.sourcePageNumber) -
                    Number(b.sourcePageNumber)
            );


    /*
    Keep only pages containing approved story text.
    */

    const storyPages =
        orderedPages.filter(
            page => {

                if (page.noStoryText) {
                    return false;
                }

                if (
                    !page.text ||
                    !page.text.trim()
                ) {
                    return false;
                }

                return true;

            }
        );


    /*
    Instead of immediately destroying page information,
    process each page independently.

    This will help us later when we want to know which
    original book page a sentence came from.
    */

    const sentenceObjects = [];


    storyPages.forEach(
        page => {

            const cleanText =
                normalizeStoryText(
                    page.text
                );


            const sentences =
                splitIntoSentences(
                    cleanText
                );


            sentences.forEach(
                sentence => {

                    sentenceObjects.push({

                        text:
                            sentence,

                        sourcePageNumber:
                            page.sourcePageNumber

                    });

                }
            );

        }
    );


    return sentenceObjects;
}


/* =====================================================
   NORMALIZE TEXT
   ===================================================== */

function normalizeStoryText(text) {

    return text

        /*
        Convert line breaks into spaces.
        */

        .replace(
            /\r\n/g,
            "\n"
        )

        .replace(
            /\r/g,
            "\n"
        )

        .replace(
            /\n+/g,
            " "
        )

        /*
        Remove repeated spaces.
        */

        .replace(
            /\s+/g,
            " "
        )

        /*
        Remove spaces before punctuation.
        */

        .replace(
            /\s+([,.!?;:])/g,
            "$1"
        )

        .trim();
}


/* =====================================================
   SENTENCE SPLITTING
   ===================================================== */

function splitIntoSentences(text) {

    /*
    This is intentionally conservative.

    We primarily split after:
       .
       !
       ?

    followed by whitespace.

    The punctuation remains attached to the sentence.
    */

    const matches =
        text.match(
            /[^.!?]+(?:[.!?]+["'”’]?|$)/g
        );


    if (!matches) {
        return [];
    }


    return matches
        .map(
            sentence =>
                sentence
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
        )
        .filter(
            sentence =>
                sentence.length > 0
        );
}


/* =====================================================
   BOOK READY SCREEN
   ===================================================== */

function prepareBookReadyScreen() {

    const displayName =
        getBookDisplayName();


    bookName.textContent =
        displayName;


    sentenceCount.textContent =
        storySentences.length;


    sourcePageCount.textContent =
        loadedBook.sourcePageCount ||
        loadedBook.pages.length;


    readingBookName.textContent =
        displayName;
}


/* =====================================================
   GET DISPLAY NAME
   ===================================================== */

function getBookDisplayName() {

    if (
        loadedBook &&
        loadedBook.sourceFileName
    ) {

        return loadedBook.sourceFileName
            .replace(
                /\.pdf$/i,
                ""
            )
            .replace(
                /_/g,
                " "
            );

    }


    if (selectedFile) {

        return selectedFile.name
            .replace(
                /_CleanBookData\.json$/i,
                ""
            )
            .replace(
                /\.json$/i,
                ""
            )
            .replace(
                /_/g,
                " "
            );

    }


    return "Today's Story";
}


/* =====================================================
   START READING
   ===================================================== */

startReadingButton.addEventListener(
    "click",
    () => {

        currentWindowStart =
            0;

        showScreen(
            readingScreen
        );

        renderReadingWindow();

    }
);


/* =====================================================
   RENDER 3-SENTENCE WINDOW
   ===================================================== */

function renderReadingWindow() {

    sentenceContainer.innerHTML =
        "";


    const remaining =
        storySentences.length -
        currentWindowStart;


    const numberToShow =
        Math.min(
            3,
            remaining
        );


    for (
        let offset = 0;
        offset < numberToShow;
        offset++
    ) {

        const sentenceIndex =
            currentWindowStart +
            offset;


        const sentence =
            storySentences[
                sentenceIndex
            ];


        const sentenceBox =
            document.createElement(
                "div"
            );


        sentenceBox.className =
            "story-sentence";


        const numberBubble =
            document.createElement(
                "span"
            );


        numberBubble.className =
            "sentence-number";


        numberBubble.textContent =
            sentenceIndex + 1;


        const sentenceText =
            document.createElement(
                "span"
            );


        sentenceText.textContent =
            sentence.text;


        sentenceBox.appendChild(
            numberBubble
        );


        sentenceBox.appendChild(
            sentenceText
        );


        sentenceContainer.appendChild(
            sentenceBox
        );

    }


    updateReadingControls();

    updateProgress();
}


/* =====================================================
   NEXT
   ===================================================== */

nextButton.addEventListener(
    "click",
    () => {

        /*
        Continue shifting forward one sentence
        while a complete 3-sentence window remains.
        */

        if (
            currentWindowStart <
            storySentences.length - 3
        ) {

            currentWindowStart +=
                1;

            renderReadingWindow();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }


        /*
        Current window contains the final three
        sentences. Reading is complete.
        */

        showScreen(
            completeScreen
        );

    }
);


/* =====================================================
   BACK
   ===================================================== */

previousButton.addEventListener(
    "click",
    () => {

        if (
            currentWindowStart <= 0
        ) {
            return;
        }


        currentWindowStart -=
            1;


        renderReadingWindow();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =====================================================
   UPDATE BUTTONS
   ===================================================== */

function updateReadingControls() {

    previousButton.disabled =
        currentWindowStart === 0;


    const finalWindowStart =
        Math.max(
            0,
            storySentences.length - 3
        );


    if (
        currentWindowStart >=
        finalWindowStart
    ) {

        nextButton.textContent =
            "Finish Story ✓";

    }
    else {

        nextButton.textContent =
            "Next →";

    }
}


/* =====================================================
   PROGRESS
   ===================================================== */

function updateProgress() {

    /*
    We count how many unique sentences Shrikar
    has encountered.

    On the first screen he has encountered 3.
    Each subsequent screen introduces one new sentence.
    */

    const uniqueSentencesSeen =
        Math.min(
            currentWindowStart + 3,
            storySentences.length
        );


    const percentage =
        Math.round(
            (
                uniqueSentencesSeen /
                storySentences.length
            ) * 100
        );


    progressText.textContent =
        `${uniqueSentencesSeen} of ${storySentences.length} sentences`;


    progressBar.style.width =
        `${percentage}%`;
}


/* =====================================================
   READ AGAIN
   ===================================================== */

readAgainButton.addEventListener(
    "click",
    () => {

        currentWindowStart =
            0;


        showScreen(
            readingScreen
        );


        renderReadingWindow();

    }
);


/* =====================================================
   NEW BOOK
   ===================================================== */

newBookButton.addEventListener(
    "click",
    () => {

        selectedFile =
            null;

        loadedBook =
            null;

        storySentences =
            [];

        currentWindowStart =
            0;


        bookFileInput.value =
            "";


        selectedFileName.textContent =
            "No book selected";


        loadBookButton.disabled =
            true;


        hideUploadError();


        showScreen(
            uploadScreen
        );

    }
);


/* =====================================================
   SCREEN MANAGEMENT
   ===================================================== */

function showScreen(screenToShow) {

    const screens = [
        uploadScreen,
        bookReadyScreen,
        readingScreen,
        completeScreen
    ];


    screens.forEach(
        screen => {

            screen.classList.add(
                "hidden"
            );

        }
    );


    screenToShow.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   ERROR MANAGEMENT
   ===================================================== */

function showUploadError(message) {

    uploadError.textContent =
        message;


    uploadError.classList.remove(
        "hidden"
    );
}


function hideUploadError() {

    uploadError.textContent =
        "";


    uploadError.classList.add(
        "hidden"
    );
}
