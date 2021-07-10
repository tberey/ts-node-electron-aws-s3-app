export class HelperService {

    static newDateTime(): string {
        const date = new Date().toUTCString();
        return date.substring(0, date.indexOf(':')-3).replace(',','').replace(/[ \s]/g, '_');
    }

    static searchTerm(term: string): string {
        term = term.toLowerCase().trim();
        if (term.includes('.')) term = term.substr(0, term.indexOf('.'));
        return term;
    }

    static bucketFormat(bucketName: string): string {
        bucketName = bucketName.toLowerCase().trim().replace(/_/g, '-').replace(/ /g, '-');
        return bucketName;
    }
}