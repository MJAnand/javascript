#script "quickExport PDF"#target "Indesign"#targetengine "medianis"#strict onmain();// ---------------------------------------------------------------------------------------------------------------function main(){    exportDocumentToPDF(app.activeDocument);}// ---------------------------------------------------------------------------------------------------------------function exportDocumentToPDF(doc, exportPreset) {    var file = File.saveDialog('Guardar PDF como');    if (file != null)        doc.exportFile(ExportFormat.PDF_TYPE, file, true);}