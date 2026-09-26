export async function openPDF(file) {

    const arrayBuffer =
        await file.arrayBuffer();

    return await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;
}


export async function extractEmbeddedText(page) {

    try {

        const content =
            await page.getTextContent();

        return content.items
            .map(item => item.str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

    } catch {

        return "";

    }
}


export async function renderPage(
    page,
    scale = 2.4
) {

    const viewport =
        page.getViewport({ scale });

    const canvas =
        document.createElement("canvas");

    canvas.width =
        Math.floor(viewport.width);

    canvas.height =
        Math.floor(viewport.height);

    const context =
        canvas.getContext(
            "2d",
            { willReadFrequently: true }
        );

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return canvas;
}
