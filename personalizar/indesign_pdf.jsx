function place_pdf_file(container, pdf_file, pdf_page, pdf_crop){	app.pdfPlacePreferences.transparentBackground = true;	app.pdfPlacePreferences.pdfCrop = (pdf_crop == undefined) ? PDFCrop.CROP_MEDIA : pdf_crop;        if (pdf_page != undefined)        app.pdfPlacePreferences.pageNumber = page;        	return container.place(pdf_file)[0];}function export_document_to_pdf(pdf_file, document, showingOptions){    if (document == undefined)        document = app.activeDocument;    if (showingOptions == undefined)         showingOptions = false;            document.links.everyItem().update(); // Actualiza enlaces antes de exportar        document.exportFile(ExportFormat.pdfType, new File(decodeURI(pdf_file)),         showingOptions);}