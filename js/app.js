/*
=========================================================
SHRIKAR READING COMPREHENSION
VERSION 2.2 — UNIVERSAL ENGINE
=========================================================

This application is BOOK-INDEPENDENT.

It does not contain Nate the Great questions or
questions for any other specific story.

It accepts:

1. ShrikarBookOCR JSON
   - clean story text only

OR

2. ShrikarPreparedBook JSON
   - story text
   - context bridges
   - comprehension checkpoints
   - questions
   - hints
   - choices
   - parent answer guides

READING METHOD

Each learning block contains 6 NEW sentences.

Within each block:

1,2,3
2,3,4
3,4,5
4,5,6

CHECKPOINT

Then:

7,8,9
8,9,10
9,10,11
10,11,12

CHECKPOINT

etc.

=========================================================
*/


/* =====================================================
   CONFIGURATION
   ===================================================== */

const SENTENCES_PER_BLOCK = 6;

const SENTENCES_PER_WINDOW = 3;


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const uploadScreen =
    document.getElementById("uploadScreen");

const bookReadyScreen =
    document.getElementById("bookReadyScreen");

const readingScreen =
    document.getElementById("readingScreen");

const checkpointIntroScreen =
    document.getElementById("checkpointIntroScreen");

const questionScreen =
    document.getElementById("questionScreen");

const checkpointCompleteScreen =
    document.getElementById("checkpointCompleteScreen");

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

const readingScore =
    document.getElementById("readingScore");

const progressText =
    document.getElementById("progressText");

const progressBar =
    document.getElementById("progressBar");

const sentenceContainer =
    document.getElementById("sentenceContainer");

const contextText =
    document.getElementById("contextText");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");


const checkpointRangeText =
    document.getElementById("checkpointRangeText");

const beginQuestionsButton =
    document.getElementById("beginQuestionsButton");


const questionTotalScore =
    document.getElementById("questionTotalScore");

const questionProgressBar =
    document.getElementById("questionProgressBar");

const questionNumber =
    document.getElementById("questionNumber");

const questionType =
    document.getElementById("questionType");

const questionText =
    document.getElementById("questionText");

const showHintButton =
    document.getElementById("showHintButton");

const showChoicesButton =
    document.getElementById("showChoicesButton");

const hintBox =
    document.getElementById("hintBox");

const hintText =
    document.getElementById("hintText");

const choicesBox =
    document.getElementById("choicesBox");

const choicesContainer =
    document.getElementById("choicesContainer");

const answerGuideBox =
    document.getElementById("answerGuideBox");

const expectedAnswerText =
    document.getElementById("expectedAnswerText");

const showAnswerGuideButton =
    document.getElementById("showAnswerGuideButton");


const independentButton =
    document.getElementById("independentButton");

const hintScoreButton =
    document.getElementById("hintScoreButton");

const choicesScoreButton =
    document.getElementById("choicesScoreButton");

const notYetButton =
    document.getElementById("notYetButton");

const parentUnsureButton =
    document.getElementById("parentUnsureButton");

const scoreFeedback =
    document.getElementById("scoreFeedback");

const nextQuestionButton =
    document.getElementById("nextQuestionButton");


const checkpointPointsEarned =
    document.getElementById("checkpointPointsEarned");

const checkpointMessage =
    document.getElementById("checkpointMessage");

const checkpointBreakdown =
    document.getElementById("checkpointBreakdown");

const totalStoryScore =
    document.getElementById("totalStoryScore");

const continueStoryButton =
    document.getElementById("continueStoryButton");


const finalScore =
    document.getElementById("finalScore");

const finalSessionSummary =
    document.getElementById("finalSessionSummary");

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

let preparedCheckpoints = [];

let preparedContexts = [];


/*
Current six-sentence block.

0 = sentences 1–6
1 = sentences 7–12
2 = sentences 13–18
*/

let currentBlockIndex = 0;


/*
Window position INSIDE the current block.

0:
1,2,3

1:
2,3,4

2:
3,4,5

3:
4,5,6
*/

let currentWindowOffset = 0;


let currentCheckpoint = null;

let currentQuestionIndex = 0;

let currentCheckpointResults = [];

let sessionResults = [];

let totalPoints = 0;

let hintWasOpened = false;

let choicesWereOpened = false;

let answerWasOpened = false;

let questionHasBeenScored = false;


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

            loadBookButton.disabled = true;

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

            loadBookButton.disabled = true;

            showUploadError(
                "Please choose a JSON book file."
            );

            return;
        }


        selectedFile = file;

        selectedFileName.textContent =
            file.name;

        loadBookButton.disabled = false;

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

        loadBookButton.disabled = true;

        loadBookButton.textContent =
            "Loading Story...";


        try {

            const rawText =
                await selectedFile.text();


            const bookData =
                JSON.parse(rawText);


            validateBookData(bookData);


            loadedBook = bookData;


            storySentences =
                buildStorySentences(bookData);


            if (
                storySentences.length <
                SENTENCES_PER_WINDOW
            ) {

                throw new Error(
                    "This book does not contain enough readable story sentences."
                );

            }


            loadPreparedLearningData(
                bookData
            );


            resetSession();


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

            loadBookButton.disabled = false;

            loadBookButton.textContent =
                "Load My Story";

        }

    }
);


/* =====================================================
   VALIDATE FILE
   ===================================================== */

function validateBookData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "The selected file is not valid book data."
        );

    }


    const supportedFormats = [
        "ShrikarBookOCR",
        "ShrikarPreparedBook"
    ];


    if (
        !supportedFormats.includes(
            data.format
        )
    ) {

        throw new Error(
            "This file is not a supported Shrikar book file."
        );

    }


    if (
        !Array.isArray(data.pages) ||
        data.pages.length === 0
    ) {

        throw new Error(
            "The book contains no page data."
        );

    }

}


/* =====================================================
   BUILD STORY SENTENCES
   ===================================================== */

function buildStorySentences(bookData) {

    /*
    Prepared books may already contain
    sentence objects.
    */

    if (
        Array.isArray(bookData.sentences) &&
        bookData.sentences.length > 0
    ) {

        return bookData.sentences.map(
            (sentence, index) => {

                if (
                    typeof sentence ===
                    "string"
                ) {

                    return {
                        number: index + 1,
                        text: sentence,
                        sourcePageNumber: null
                    };

                }


                return {

                    number:
                        sentence.number ||
                        index + 1,

                    text:
                        sentence.text || "",

                    sourcePageNumber:
                        sentence.sourcePageNumber ??
                        null

                };

            }
        );

    }


    /*
    Otherwise build sentences from the
    standard OCR Extractor page data.
    */

    const orderedPages =
        [...bookData.pages]
            .sort(
                (a, b) =>
                    Number(
                        a.sourcePageNumber
                    ) -
                    Number(
                        b.sourcePageNumber
                    )
            );


    const sentenceObjects = [];


    orderedPages.forEach(
        page => {

            if (page.noStoryText) {
                return;
            }


            if (
                !page.text ||
                !page.text.trim()
            ) {
                return;
            }


            const normalized =
                normalizeStoryText(
                    page.text
                );


            const pageSentences =
                splitIntoSentences(
                    normalized
                );


            pageSentences.forEach(
                sentence => {

                    sentenceObjects.push({

                        number:
                            sentenceObjects.length +
                            1,

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
   TEXT NORMALIZATION
   ===================================================== */

function normalizeStoryText(text) {

    return text

        .replace(/\r\n/g, "\n")

        .replace(/\r/g, "\n")

        .replace(/\n+/g, " ")

        .replace(/\s+/g, " ")

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
                    .replace(/\s+/g, " ")
                    .trim()
        )

        .filter(
            sentence =>
                sentence.length > 0
        );
}


/* =====================================================
   LOAD PREPARED LEARNING DATA
   ===================================================== */

function loadPreparedLearningData(
    bookData
) {

    preparedCheckpoints =
        Array.isArray(
            bookData.checkpoints
        )
            ? bookData.checkpoints
            : [];


    preparedContexts =
        Array.isArray(
            bookData.contexts
        )
            ? bookData.contexts
            : [];
}


/* =====================================================
   RESET SESSION
   ===================================================== */

function resetSession() {

    currentBlockIndex = 0;

    currentWindowOffset = 0;

    currentCheckpoint = null;

    currentQuestionIndex = 0;

    currentCheckpointResults = [];

    sessionResults = [];

    totalPoints = 0;

    readingScore.textContent = "0";

    questionTotalScore.textContent = "0";

    totalStoryScore.textContent = "0";

    finalScore.textContent = "0";
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
   BOOK NAME
   ===================================================== */

function getBookDisplayName() {

    if (
        loadedBook &&
        loadedBook.title
    ) {

        return loadedBook.title;
    }


    if (
        loadedBook &&
        loadedBook.sourceFileName
    ) {

        return loadedBook
            .sourceFileName
            .replace(/\.pdf$/i, "")
            .replace(/_/g, " ");

    }


    return "Today's Story";
}


/* =====================================================
   START READING
   ===================================================== */

startReadingButton.addEventListener(
    "click",
    () => {

        resetSession();

        showScreen(
            readingScreen
        );

        renderReadingWindow();

    }
);


/* =====================================================
   BLOCK HELPERS
   ===================================================== */

function getBlockStartIndex() {

    return (
        currentBlockIndex *
        SENTENCES_PER_BLOCK
    );
}


function getBlockEndIndex() {

    return Math.min(
        getBlockStartIndex() +
            SENTENCES_PER_BLOCK,

        storySentences.length
    );
}


function getBlockSentenceCount() {

    return (
        getBlockEndIndex() -
        getBlockStartIndex()
    );
}


/* =====================================================
   RENDER READING WINDOW
   ===================================================== */

function renderReadingWindow() {

    sentenceContainer.innerHTML = "";


    const blockStart =
        getBlockStartIndex();


    const blockEnd =
        getBlockEndIndex();


    const windowStart =
        blockStart +
        currentWindowOffset;


    const windowEnd =
        Math.min(
            windowStart +
            SENTENCES_PER_WINDOW,
            blockEnd
        );


    for (
        let index = windowStart;
        index < windowEnd;
        index++
    ) {

        const sentence =
            storySentences[index];


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
            index + 1;


        const sentenceTextElement =
            document.createElement(
                "span"
            );


        sentenceTextElement.textContent =
            sentence.text;


        sentenceBox.appendChild(
            numberBubble
        );


        sentenceBox.appendChild(
            sentenceTextElement
        );


        sentenceContainer.appendChild(
            sentenceBox
        );

    }


    renderContextBridge(
        windowStart,
        windowEnd
    );


    updateReadingControls();

    updateReadingProgress();
}


/* =====================================================
   CONTEXT BRIDGE
   ===================================================== */

function renderContextBridge(
    windowStart,
    windowEnd
) {

    const preparedContext =
        preparedContexts.find(
            item =>
                Number(item.startSentence) ===
                    windowStart + 1 &&
                Number(item.endSentence) ===
                    windowEnd
        );


    if (
        preparedContext &&
        preparedContext.text
    ) {

        contextText.textContent =
            preparedContext.text;

        return;
    }


    /*
    IMPORTANT:
    We do not invent a story summary when
    no prepared context exists.
    */

    contextText.textContent =
        "Think: What is happening in these sentences? How does this connect to what happened just before?";
}


/* =====================================================
   READING CONTROLS
   ===================================================== */

function updateReadingControls() {

    previousButton.disabled =
        (
            currentBlockIndex === 0 &&
            currentWindowOffset === 0
        );


    const blockSentenceCount =
        getBlockSentenceCount();


    const finalWindowOffset =
        Math.max(
            0,
            blockSentenceCount -
            SENTENCES_PER_WINDOW
        );


    if (
        currentWindowOffset >=
        finalWindowOffset
    ) {

        if (
            getBlockEndIndex() >=
            storySentences.length
        ) {

            nextButton.textContent =
                "Finish Reading ✓";

        }
        else {

            nextButton.textContent =
                "Comprehension Check 🧠";

        }

    }
    else {

        nextButton.textContent =
            "Next →";

    }
}


/* =====================================================
   NEXT READING WINDOW
   ===================================================== */

nextButton.addEventListener(
    "click",
    () => {

        const blockSentenceCount =
            getBlockSentenceCount();


        const finalWindowOffset =
            Math.max(
                0,
                blockSentenceCount -
                SENTENCES_PER_WINDOW
            );


        if (
            currentWindowOffset <
            finalWindowOffset
        ) {

            currentWindowOffset += 1;

            renderReadingWindow();

            scrollTop();

            return;
        }


        /*
        End of current block.
        */

        if (
            getBlockEndIndex() >=
            storySentences.length
        ) {

            finishStory();

            return;
        }


        openCheckpoint();

    }
);


/* =====================================================
   BACK BUTTON
   ===================================================== */

previousButton.addEventListener(
    "click",
    () => {

        if (
            currentWindowOffset > 0
        ) {

            currentWindowOffset -= 1;

            renderReadingWindow();

            scrollTop();

            return;
        }


        /*
        If we are at the first window of a later block,
        return to the final reading window of the
        previous block.
        */

        if (
            currentBlockIndex > 0
        ) {

            currentBlockIndex -= 1;


            const previousBlockCount =
                getBlockSentenceCount();


            currentWindowOffset =
                Math.max(
                    0,
                    previousBlockCount -
                    SENTENCES_PER_WINDOW
                );


            renderReadingWindow();

            scrollTop();
        }

    }
);


/* =====================================================
   READING PROGRESS
   ===================================================== */

function updateReadingProgress() {

    const uniqueSeen =
        Math.min(
            getBlockStartIndex() +
                currentWindowOffset +
                SENTENCES_PER_WINDOW,

            storySentences.length
        );


    const percentage =
        Math.round(
            (
                uniqueSeen /
                storySentences.length
            ) * 100
        );


    progressText.textContent =
        `${uniqueSeen} of ${storySentences.length} sentences`;


    progressBar.style.width =
        `${percentage}%`;


    readingScore.textContent =
        totalPoints;
}


/* =====================================================
   OPEN CHECKPOINT
   ===================================================== */

function openCheckpoint() {

    const startSentence =
        getBlockStartIndex() + 1;


    const endSentence =
        getBlockEndIndex();


    currentCheckpoint =
        findPreparedCheckpoint(
            startSentence,
            endSentence
        );


    checkpointRangeText.textContent =
        `You just read sentences ${startSentence}–${endSentence}.`;


    /*
    If this is only raw OCR data,
    we can still identify the checkpoint,
    but we will not fabricate questions.
    */

    if (
        !currentCheckpoint ||
        !Array.isArray(
            currentCheckpoint.questions
        ) ||
        currentCheckpoint.questions.length === 0
    ) {

        showMissingCheckpointMessage(
            startSentence,
            endSentence
        );

        return;
    }


    showScreen(
        checkpointIntroScreen
    );
}


/* =====================================================
   FIND PREPARED CHECKPOINT
   ===================================================== */

function findPreparedCheckpoint(
    startSentence,
    endSentence
) {

    return preparedCheckpoints.find(
        checkpoint =>
            Number(
                checkpoint.startSentence
            ) === startSentence &&
            Number(
                checkpoint.endSentence
            ) === endSentence
    );
}


/* =====================================================
   RAW OCR / MISSING QUESTION HANDLING
   ===================================================== */

function showMissingCheckpointMessage(
    startSentence,
    endSentence
) {

    /*
    For now we use the checkpoint intro screen
    to clearly explain why questions are unavailable.
    */

    showScreen(
        checkpointIntroScreen
    );


    checkpointRangeText.innerHTML =
        `
        You completed sentences
        <strong>${startSentence}–${endSentence}</strong>.
        <br><br>
        This book contains clean story text,
        but comprehension questions have not yet
        been prepared for this section.
        `;


    beginQuestionsButton.textContent =
        "Continue Reading →";


    beginQuestionsButton.dataset.mode =
        "continueWithoutQuestions";
}


/* =====================================================
   BEGIN QUESTIONS
   ===================================================== */

beginQuestionsButton.addEventListener(
    "click",
    () => {

        if (
            beginQuestionsButton.dataset.mode ===
            "continueWithoutQuestions"
        ) {

            beginQuestionsButton.dataset.mode =
                "";

            beginQuestionsButton.textContent =
                "🧠 Start Questions";


            moveToNextReadingBlock();

            return;
        }


        currentQuestionIndex = 0;

        currentCheckpointResults = [];


        showScreen(
            questionScreen
        );


        renderQuestion();

    }
);


/* =====================================================
   RENDER QUESTION
   ===================================================== */

function renderQuestion() {

    resetQuestionSupportState();


    const questions =
        currentCheckpoint.questions;


    const question =
        questions[
            currentQuestionIndex
        ];


    questionNumber.textContent =
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;


    questionType.textContent =
        question.type ||
        "Comprehension";


    questionText.textContent =
        question.question;


    hintText.textContent =
        question.hint ||
        "Think carefully about what you just read.";


    renderChoices(
        question.choices || []
    );


    expectedAnswerText.textContent =
        question.parentGuide ||
        question.expectedAnswer ||
        "Listen for the main idea from the story.";


    const percentage =
        Math.round(
            (
                currentQuestionIndex /
                questions.length
            ) * 100
        );


    questionProgressBar.style.width =
        `${percentage}%`;


    questionTotalScore.textContent =
        totalPoints;
}


/* =====================================================
   RENDER CHOICES
   ===================================================== */

function renderChoices(choices) {

    choicesContainer.innerHTML = "";


    choices.forEach(
        choice => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "choice-item";


            item.textContent =
                choice;


            choicesContainer.appendChild(
                item
            );

        }
    );


    if (choices.length === 0) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "choice-item";


        item.textContent =
            "No prepared choices are available for this question.";


        choicesContainer.appendChild(
            item
        );
    }
}


/* =====================================================
   QUESTION SUPPORT
   ===================================================== */

showHintButton.addEventListener(
    "click",
    () => {

        hintWasOpened = true;

        hintBox.classList.remove(
            "hidden"
        );


        updateScoreButtonAvailability();

    }
);


showChoicesButton.addEventListener(
    "click",
    () => {

        choicesWereOpened = true;

        hintWasOpened = true;


        hintBox.classList.remove(
            "hidden"
        );


        choicesBox.classList.remove(
            "hidden"
        );


        updateScoreButtonAvailability();

    }
);


showAnswerGuideButton.addEventListener(
    "click",
    () => {

        answerWasOpened = true;


        answerGuideBox.classList.remove(
            "hidden"
        );


        updateScoreButtonAvailability();

    }
);


/* =====================================================
   HONEST SCORING GUARDRAILS
   ===================================================== */

function updateScoreButtonAvailability() {

    /*
    If support was opened, higher scores
    are disabled.

    This prevents accidental over-scoring.
    */


    independentButton.disabled =
        hintWasOpened ||
        choicesWereOpened ||
        answerWasOpened;


    hintScoreButton.disabled =
        !hintWasOpened ||
        choicesWereOpened ||
        answerWasOpened;


    choicesScoreButton.disabled =
        !choicesWereOpened ||
        answerWasOpened;


    /*
    "Not Yet" always remains possible.
    */

    notYetButton.disabled =
        false;
}


/* =====================================================
   SCORE BUTTONS
   ===================================================== */

independentButton.addEventListener(
    "click",
    () => {

        scoreCurrentQuestion(
            3,
            "Independent"
        );

    }
);


hintScoreButton.addEventListener(
    "click",
    () => {

        scoreCurrentQuestion(
            2,
            "After Hint"
        );

    }
);


choicesScoreButton.addEventListener(
    "click",
    () => {

        scoreCurrentQuestion(
            1,
            "After Choices"
        );

    }
);


notYetButton.addEventListener(
    "click",
    () => {

        scoreCurrentQuestion(
            0,
            "Not Yet"
        );

    }
);


/* =====================================================
   PARENT UNSURE
   ===================================================== */

parentUnsureButton.addEventListener(
    "click",
    () => {

        answerGuideBox.classList.remove(
            "hidden"
        );


        answerWasOpened = true;


        updateScoreButtonAvailability();


        scoreFeedback.classList.remove(
            "hidden"
        );


        scoreFeedback.textContent =
            "Compare Shrikar's answer with the Parent Guide. If the important idea is there, you can count it. Exact wording is not required.";

    }
);


/* =====================================================
   SCORE CURRENT QUESTION
   ===================================================== */

function scoreCurrentQuestion(
    points,
    assistance
) {

    if (questionHasBeenScored) {
        return;
    }


    questionHasBeenScored = true;


    const question =
        currentCheckpoint.questions[
            currentQuestionIndex
        ];


    totalPoints += points;


    currentCheckpointResults.push({

        questionNumber:
            currentQuestionIndex + 1,

        type:
            question.type ||
            "Comprehension",

        points:
            points,

        assistance:
            assistance

    });


    sessionResults.push({

        checkpointStart:
            currentCheckpoint.startSentence,

        checkpointEnd:
            currentCheckpoint.endSentence,

        questionType:
            question.type ||
            "Comprehension",

        points:
            points,

        assistance:
            assistance

    });


    questionTotalScore.textContent =
        totalPoints;


    readingScore.textContent =
        totalPoints;


    scoreFeedback.classList.remove(
        "hidden"
    );


    if (points === 3) {

        scoreFeedback.textContent =
            "⭐⭐⭐ 3 points — Great independent thinking!";

    }
    else if (points === 2) {

        scoreFeedback.textContent =
            "⭐⭐ 2 points — The hint helped you connect the idea!";

    }
    else if (points === 1) {

        scoreFeedback.textContent =
            "⭐ 1 point — You found it with some choices!";

    }
    else {

        scoreFeedback.textContent =
            "0 points this time — that's okay. Read the answer together and keep going.";

        answerGuideBox.classList.remove(
            "hidden"
        );

    }


    disableScoringButtons();


    nextQuestionButton.classList.remove(
        "hidden"
    );


    const questions =
        currentCheckpoint.questions;


    if (
        currentQuestionIndex ===
        questions.length - 1
    ) {

        nextQuestionButton.textContent =
            "See Checkpoint Results →";

    }
    else {

        nextQuestionButton.textContent =
            "Next Question →";

    }
}


/* =====================================================
   NEXT QUESTION
   ===================================================== */

nextQuestionButton.addEventListener(
    "click",
    () => {

        const questions =
            currentCheckpoint.questions;


        if (
            currentQuestionIndex <
            questions.length - 1
        ) {

            currentQuestionIndex += 1;

            renderQuestion();

            scrollTop();

            return;
        }


        showCheckpointResults();

    }
);


/* =====================================================
   RESET QUESTION UI
   ===================================================== */

function resetQuestionSupportState() {

    hintWasOpened = false;

    choicesWereOpened = false;

    answerWasOpened = false;

    questionHasBeenScored = false;


    hintBox.classList.add(
        "hidden"
    );


    choicesBox.classList.add(
        "hidden"
    );


    answerGuideBox.classList.add(
        "hidden"
    );


    scoreFeedback.classList.add(
        "hidden"
    );


    scoreFeedback.textContent = "";


    nextQuestionButton.classList.add(
        "hidden"
    );


    independentButton.disabled = false;

    hintScoreButton.disabled = true;

    choicesScoreButton.disabled = true;

    notYetButton.disabled = false;
}


/* =====================================================
   DISABLE SCORE BUTTONS AFTER SCORING
   ===================================================== */

function disableScoringButtons() {

    independentButton.disabled = true;

    hintScoreButton.disabled = true;

    choicesScoreButton.disabled = true;

    notYetButton.disabled = true;

    showHintButton.disabled = true;

    showChoicesButton.disabled = true;
}


/* =====================================================
   CHECKPOINT RESULTS
   ===================================================== */

function showCheckpointResults() {

    const pointsEarned =
        currentCheckpointResults.reduce(
            (sum, result) =>
                sum + result.points,
            0
        );


    const maximumPoints =
        currentCheckpoint.questions.length *
        3;


    checkpointPointsEarned.textContent =
        pointsEarned;


    const scoreOutOfElement =
        document.querySelector(
            ".score-out-of"
        );


    if (scoreOutOfElement) {

        scoreOutOfElement.textContent =
            `out of ${maximumPoints} points`;

    }


    if (
        pointsEarned === maximumPoints
    ) {

        checkpointMessage.textContent =
            "Excellent! You remembered the ideas independently!";

    }
    else if (
        pointsEarned >=
        maximumPoints * 0.67
    ) {

        checkpointMessage.textContent =
            "Nice work! You understood most of this part.";

    }
    else {

        checkpointMessage.textContent =
            "Good effort. The support helped us see what to practice.";

    }


    checkpointBreakdown.innerHTML = "";


    currentCheckpointResults.forEach(
        result => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "breakdown-row";


            row.innerHTML =
                `
                <span>
                    ${escapeHTML(result.type)}
                </span>

                <strong>
                    ${result.points}/3
                    — ${escapeHTML(result.assistance)}
                </strong>
                `;


            checkpointBreakdown.appendChild(
                row
            );

        }
    );


    totalStoryScore.textContent =
        totalPoints;


    showScreen(
        checkpointCompleteScreen
    );
}


/* =====================================================
   CONTINUE AFTER CHECKPOINT
   ===================================================== */

continueStoryButton.addEventListener(
    "click",
    () => {

        moveToNextReadingBlock();

    }
);


function moveToNextReadingBlock() {

    currentBlockIndex += 1;

    currentWindowOffset = 0;

    currentCheckpoint = null;

    currentCheckpointResults = [];


    if (
        getBlockStartIndex() >=
        storySentences.length
    ) {

        finishStory();

        return;
    }


    showScreen(
        readingScreen
    );


    renderReadingWindow();
}


/* =====================================================
   FINISH STORY
   ===================================================== */

function finishStory() {

    finalScore.textContent =
        totalPoints;


    renderFinalSessionSummary();


    showScreen(
        completeScreen
    );
}


/* =====================================================
   FINAL SESSION SUMMARY
   ===================================================== */

function renderFinalSessionSummary() {

    finalSessionSummary.innerHTML = "";


    if (
        sessionResults.length === 0
    ) {

        finalSessionSummary.innerHTML =
            `
            <p>
                Reading completed.
                No prepared comprehension questions
                were available for this book yet.
            </p>
            `;

        return;
    }


    const independent =
        sessionResults.filter(
            result =>
                result.points === 3
        ).length;


    const hint =
        sessionResults.filter(
            result =>
                result.points === 2
        ).length;


    const choices =
        sessionResults.filter(
            result =>
                result.points === 1
        ).length;


    const notYet =
        sessionResults.filter(
            result =>
                result.points === 0
        ).length;


    finalSessionSummary.innerHTML =
        `
        <div class="breakdown-row">
            <span>Answered independently</span>
            <strong>${independent}</strong>
        </div>

        <div class="breakdown-row">
            <span>Needed a hint</span>
            <strong>${hint}</strong>
        </div>

        <div class="breakdown-row">
            <span>Needed choices</span>
            <strong>${choices}</strong>
        </div>

        <div class="breakdown-row">
            <span>Not yet / answer reviewed</span>
            <strong>${notYet}</strong>
        </div>
        `;
}


/* =====================================================
   READ AGAIN
   ===================================================== */

readAgainButton.addEventListener(
    "click",
    () => {

        resetSession();


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

        selectedFile = null;

        loadedBook = null;

        storySentences = [];

        preparedCheckpoints = [];

        preparedContexts = [];


        resetSession();


        bookFileInput.value = "";


        selectedFileName.textContent =
            "No book selected";


        loadBookButton.disabled = true;


        hideUploadError();


        showScreen(
            uploadScreen
        );

    }
);


/* =====================================================
   SCREEN MANAGEMENT
   ===================================================== */

function showScreen(
    screenToShow
) {

    const screens = [

        uploadScreen,
        bookReadyScreen,
        readingScreen,
        checkpointIntroScreen,
        questionScreen,
        checkpointCompleteScreen,
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


    scrollTop();
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

    uploadError.textContent = "";


    uploadError.classList.add(
        "hidden"
    );
}


/* =====================================================
   UTILITIES
   ===================================================== */

function scrollTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}
