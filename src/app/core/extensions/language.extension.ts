export class LanguageExtension {

    public static GetLanguageCode(language: string): string {
        let code;
        switch (language) {
            case 'en':
                code = 'en-us';
                break;
            case 'no':
                code = 'no';
                break;
        }
        return code;
    }
}