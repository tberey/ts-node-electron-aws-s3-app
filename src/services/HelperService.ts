export class HelperService {
    
    constructor() {}

    public searchTerm(term: any): string {
        term = term.toString().toLowerCase().trim();
        if (term.includes('.')) term = term.substr(0, term.indexOf('.'));
        return term;
    }

    public bucketFormat(bucketName: any): string {
        bucketName = bucketName.toString().toLowerCase().trim().replace(/_/g, '-').replace(/ /g, '-');
        return bucketName;
    }

    public fileSearchFormat(fileNameOrPath: any): string {
        return fileNameOrPath = fileNameOrPath.toString();
    }
}