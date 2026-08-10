import type { HttpClient } from '../HttpClient';
import {
    ApplicationCatalog,
    AuthCatalog,
    ConfigValueCatalog,
    FormCatalog,
    MediaCatalog,
    PageCatalog,
    SitemapCatalog,
    UserCatalog,
    ValidationCatalog,
} from './catalogs';

/**
 * Aggregates every domain catalog exposed by the SDK.
 */
export class Catalog {
    private readonly http: HttpClient;
    public readonly application: ApplicationCatalog;
    public readonly auth: AuthCatalog;
    public readonly configValue: ConfigValueCatalog;
    public readonly form: FormCatalog;
    public readonly media: MediaCatalog;
    public readonly page: PageCatalog;
    public readonly sitemap: SitemapCatalog;
    public readonly user: UserCatalog;
    public readonly validation: ValidationCatalog;

    public constructor(http: HttpClient) {
        this.http = http;
        this.application = new ApplicationCatalog(http);
        this.auth = new AuthCatalog(http);
        this.configValue = new ConfigValueCatalog(http);
        this.form = new FormCatalog(http);
        this.media = new MediaCatalog(http);
        this.page = new PageCatalog(http);
        this.sitemap = new SitemapCatalog(http);
        this.user = new UserCatalog(http);
        this.validation = new ValidationCatalog(http);
    }
}
