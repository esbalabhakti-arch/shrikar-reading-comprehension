import { cleanOCRText } from "./text-cleaner.js";


export async function recognizePage(
    canvas,
    pageNumber,
    totalPages,
    statusCallback
) {

    const result =
        await Tesseract.recognize(
            canvas,
            "eng",
            {
                logger: message => {

                    if (
                        message.status ===
                        "recognizing text"
                    ) {

                        const percent =
                            Math.round(
                                message.progress * 100
                            );

                        statusCallback(
                            `Scanning page ${pageNumber} of ${totalPages} — ${percent}%`
                        );
                    }
                }
            }
        );

    return cleanOCRText(
        result.data.text
    );
}
