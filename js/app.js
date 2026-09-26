import {
    openPDF,
    extractEmbeddedText,
    renderPage
} from "./pdf-reader.js";


import {
    recognizePage
} from "./ocr.js";


/*
==========================================
PDF.JS CONFIGURATION
==========================================
*/

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/*
==========================================
ELEMENTS
==========================================
*/

const pdfFile =
    document.getElementById("pdfFile");


const processButton =
    document.getElementById("processButton");


const processingCard =
    document.getElementById("processingCard");


const reviewCard =
    document.getElementById("reviewCard");


const statusText =
    document.getElementById("statusText");


const progressBar =
    document.getElementById("progressBar");


const progressText =
    document.getElementById("progressText");


const pagesContainer =
    document.getElementById("pagesContainer");


const fileInfo =
    document.getElementById("fileInfo");


const errorBox =
    document.getElementById("errorBox");


const saveButton =
    document.getElementById("saveButton");


let extractedPages = [];


/*
==========================================
ERROR
==========================================
*/

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}


/*
==========================================
PROGRESS
==========================================
*/

function updateProgress(
    current,
    total,
    message
) {

    const percent =
        Math.round(
            (current / total) * 100
        );


    progressBar.style.width =
        percent + "%";


    progressText.textContent =
        percent + "%";


    statusText.textContent =
        message;

}


/*
==========================================
CREATE REVIEW PAGE
==========================================
*/

async function createReviewPage(
    page,
    pageNumber,
    extractedText,
    extractionMethod
) {

    const review =
        document.createElement("div");


    review.className =
        "page-review";


    /*
    LEFT SIDE
    */

    const imageSide =
        document.createElement("div");


    const pageTitle =
        document.createElement("h3");


    pageTitle.textContent =
        `PDF Page ${pageNumber}`;


    imageSide.appendChild(
        pageTitle
    );


    const method =
        document.createElement("div");


    method.className =
        "page-status";


    method.textContent =
        `Extraction: ${extractionMethod}`;


    imageSide.appendChild(
        method
    );


    /*
    Render a smaller copy for review.
    */

    const displayCanvas =
        await renderPage(
            page,
            1.1
        );


    imageSide.appendChild(
        displayCanvas
    );


    /*
    RIGHT SIDE
    */

    const textSide =
        document.createElement("div");


    const textTitle =
        document.createElement("h3");


    textTitle.textContent =
        "Extracted Text";


    textSide.appendChild(
        textTitle
    );


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        extractedText;


    textarea.dataset.page =
        pageNumber;


    textSide.appendChild(
        textarea
    );


    /*
    COMBINE
    */

    review.appendChild(
        imageSide
    );


    review.appendChild(
        textSide
    );


    pagesContainer.appendChild(
        review
    );

}


/*
==========================================
PROCESS BOOK
==========================================
*/

processButton.addEventListener(
    "click",

    async () => {

        errorBox.classList.add(
            "hidden"
        );


        const file =
            pdfFile.files[0];


        if (!file) {

            showError(
                "Please choose a PDF first."
            );

            return;

        }


        try {

            processButton.disabled =
                true;


            processingCard.classList.remove(
                "hidden"
            );


            reviewCard.classList.add(
                "hidden"
            );


            pagesContainer.innerHTML =
                "";


            extractedPages =
                [];


            statusText.textContent =
                "Opening PDF...";


            /*
            OPEN PDF
            */

            const pdf =
                await openPDF(file);


            const totalPages =
                pdf.numPages;


            fileInfo.textContent =
                `${file.name} — ${totalPages} pages`;


            /*
            PROCESS PAGES
            */

            for (
                let pageNumber = 1;
                pageNumber <= totalPages;
                pageNumber++
            ) {

                updateProgress(

                    pageNumber - 1,

                    totalPages,

                    `Preparing page ${pageNumber} of ${totalPages}...`

                );


                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                /*
                TRY EMBEDDED TEXT
                */

                let extractedText =
                    await extractEmbeddedText(
                        page
                    );


                let extractionMethod =
                    "Embedded PDF Text";


                /*
                SCANNED PAGE?
                */

                if (
                    extractedText.length < 40
                ) {

                    extractionMethod =
                        "Scanned Page OCR";


                    /*
                    High-resolution rendering
                    for OCR.
                    */

                    const ocrCanvas =
                        await renderPage(
                            page,
                            2.4
                        );


                    extractedText =
                        await recognizePage(

                            ocrCanvas,

                            pageNumber,

                            totalPages,

                            message => {

                                statusText.textContent =
                                    message;

                            }

                        );


                    /*
                    Free the large OCR canvas.
                    */

                    ocrCanvas.width =
                        1;

                    ocrCanvas.height =
                        1;

                }


                /*
                STORE
                */

                extractedPages.push({

                    pageNumber:
                        pageNumber,

                    text:
                        extractedText,

                    extractionMethod:
                        extractionMethod

                });


                /*
                REVIEW UI
                */

                await createReviewPage(

                    page,

                    pageNumber,

                    extractedText,

                    extractionMethod

                );


                updateProgress(

                    pageNumber,

                    totalPages,

                    `Finished page ${pageNumber} of ${totalPages}`

                );

            }


            /*
            FINISHED
            */

            statusText.textContent =
                "Book processing complete!";


            progressBar.style.width =
                "100%";


            progressText.textContent =
                "100%";


            reviewCard.classList.remove(
                "hidden"
            );


            reviewCard.scrollIntoView({
                behavior: "smooth"
            });

        }


        catch (error) {

            console.error(error);


            processingCard.classList.add(
                "hidden"
            );


            showError(

                "The PDF could not be processed. " +
                "Technical message: " +
                error.message

            );

        }


        finally {

            processButton.disabled =
                false;

        }

    }
);


/*
==========================================
SAVE CORRECTIONS
==========================================
*/

saveButton.addEventListener(
    "click",

    () => {

        const textareas =
            document.querySelectorAll(
                "textarea[data-page]"
            );


        const correctedPages =
            [];


        textareas.forEach(
            textarea => {

                correctedPages.push({

                    pageNumber:
                        Number(
                            textarea.dataset.page
                        ),

                    text:
                        textarea.value.trim()

                });

            }
        );


        localStorage.setItem(

            "shrikarCurrentBook",

            JSON.stringify(
                correctedPages
            )

        );


        alert(
            "Corrections saved successfully."
        );

    }
);
