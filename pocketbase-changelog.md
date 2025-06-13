## v0.28.3

- Skip sending empty `Range` header when fetching blobs from S3 ([#6914](https://github.com/pocketbase/pocketbase/pull/6914)).

- Updated Go deps and particularly `modernc.org/sqlite` to 1.38.0 (SQLite 3.50.1).

- Bumped GitHub action min Go version to 1.23.10 as it comes with some [minor security `net/http` fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.23.10+label%3ACherryPickApproved).


## v0.28.2

- Loaded latin-ext charset for the default text fonts ([#6869](https://github.com/pocketbase/pocketbase/issues/6869)).

- Updated view query CAST regex to properly recognize multiline expressions ([#6860](https://github.com/pocketbase/pocketbase/pull/6860); thanks @azat-ismagilov).

- Updated Go and npm dependencies.


## v0.28.1

- Fixed `json_each`/`json_array_length` normalizations to properly check for array values ([#6835](https://github.com/pocketbase/pocketbase/issues/6835)).


## v0.28.0

- Write the default response body of `*Request` hooks that are wrapped in a transaction after the related transaction completes to allow propagating the transaction error ([#6462](https://github.com/pocketbase/pocketbase/discussions/6462#discussioncomment-12207818)).

- Updated `app.DB()` to automatically routes raw write SQL statements to the nonconcurrent db pool ([#6689](https://github.com/pocketbase/pocketbase/discussions/6689)).
    _For the rare cases when it is needed users still have the option to explicitly target the specific pool they want using `app.ConcurrentDB()`/`app.NonconcurrentDB()`._

- ⚠️ Changed the default `json` field max size to 1MB.
    _Users still have the option to adjust the default limit from the collection field options but keep in mind that storing large strings/blobs in the database is known to cause performance issues and should be avoided when possible._

- ⚠️ Soft-deprecated and replaced `filesystem.System.GetFile(fileKey)` with `filesystem.System.GetReader(fileKey)` to avoid the confusion with `filesystem.File`.
    _The old method will still continue to work for at least until v0.29.0 but you'll get a console warning to replace it with `GetReader`._

- Added new `filesystem.System.GetReuploadableFile(fileKey, preserveName)` method to return an existing blob as a `*filesystem.File` value ([#6792](https://github.com/pocketbase/pocketbase/discussions/6792)).
    _This method could be useful in case you want to clone an existing Record file and assign it to a new Record (e.g. in a Record duplicate action)._

- Other minor improvements (updated the GitHub release min Go version to 1.23.9, updated npm and Go deps, etc.)


## v0.27.2

- Added workers pool when cascade deleting record files to minimize _"thread exhaustion"_ errors ([#6780](https://github.com/pocketbase/pocketbase/discussions/6780)).

- Updated the `:excerpt` fields modifier to properly account for multibyte characters ([#6778](https://github.com/pocketbase/pocketbase/issues/6778)).

- Use `rowid` as count column for non-view collections to minimize the need of having the id field in a covering index ([#6739](https://github.com/pocketbase/pocketbase/discussions/6739))


## v0.27.1

- Updated example `geoPoint` API preview body data.

- Added JSVM `new GeoPointField({ ... })` constructor.

- Added _partial_ WebP thumbs generation (_the thumbs will be stored as PNG_; [#6744](https://github.com/pocketbase/pocketbase/pull/6744)).

- Updated npm dev dependencies.


## v0.27.0

- ⚠️ Moved the Create and Manage API rule checks out of the `OnRecordCreateRequest` hook finalizer, **aka. now all CRUD API rules are checked BEFORE triggering their corresponding `*Request` hook**.
    This was done to minimize the confusion regarding the firing order of the request operations, making it more predictable and consistent with the other record List/View/Update/Delete request actions.
    It could be a minor breaking change if you are relying on the old behavior and have a Go `tests.ApiScenario` that is testing a Create API rule failure and expect `OnRecordCreateRequest` to be fired. In that case for example you may have to update your test scenario like:
    ```go
    tests.ApiScenario{
        Name:   "Example test that checks a Create API rule failure"
        Method: http.MethodPost,
        URL:    "/api/collections/example/records",
        ...
        // old:
        ExpectedEvents:  map[string]int{
            "*":                     0,
            "OnRecordCreateRequest": 1,
        },
        // new:
        ExpectedEvents:  map[string]int{"*": 0},
    }
    ```
    If you are having difficulties adjusting your code, feel free to open a [Q&A discussion](https://github.com/pocketbase/pocketbase/discussions) with the failing/problematic code sample.

- Added [new `geoPoint` field](https://pocketbase.io/docs/collections/#geopoint) for storing `{"lon":x,"lat":y}` geographic coordinates.
    In addition, a new [`geoDistance(lonA, lotA, lonB, lotB)` function](htts://pocketbase.io/docs/api-rules-and-filters/#geodistancelona-lata-lonb-latb) was also implemented that could be used to apply an API rule or filter constraint based on the distance (in km) between 2 geo points.

- Updated the `select` field UI to accommodate better larger lists and RTL languages ([#4674](https://github.com/pocketbase/pocketbase/issues/4674)).

- Updated the mail attachments auto MIME type detection to use `gabriel-vasile/mimetype` for consistency and broader sniffing signatures support.

- Forced `text/javascript` Content-Type when serving `.js`/`.mjs` collection uploaded files with the `/api/files/...` endpoint ([#6597](https://github.com/pocketbase/pocketbase/issues/6597)).

- Added second optional JSVM `DateTime` constructor argument for specifying a default timezone as TZ identifier when parsing the date string as alternative to a fixed offset in order to better handle daylight saving time nuances ([#6688](https://github.com/pocketbase/pocketbase/discussions/6688)):
    ```js
    // the same as with CET offset: new DateTime("2025-10-26 03:00:00 +01:00")
    new DateTime("2025-10-26 03:00:00", "Europe/Amsterdam") // 2025-10-26 02:00:00.000Z

    // the same as with CEST offset: new DateTime("2025-10-26 01:00:00 +02:00")
    new DateTime("2025-10-26 01:00:00", "Europe/Amsterdam") // 2025-10-25 23:00:00.000Z
    ```

- Soft-deprecated the `$http.send`'s `result.raw` field in favor of `result.body` that contains the response body as plain bytes slice to avoid the discrepancies between Go and the JSVM when casting binary data to string.

- Updated `modernc.org/sqlite` to 1.37.0.

- Other minor improvements (_removed the superuser fields from the auth record create/update body examples, allowed programmatically updating the auth record password from the create/update hooks, fixed collections import error response, etc._).


## v0.26.6

- Allow OIDC `email_verified` to be int or boolean string since some OIDC providers like AWS Cognito has non-standard userinfo response ([#6657](https://github.com/pocketbase/pocketbase/pull/6657)).

- Updated `modernc.org/sqlite` to 1.36.3.


## v0.26.5

- Fixed canonical URI parts escaping when generating the S3 request signature ([#6654](https://github.com/pocketbase/pocketbase/issues/6654)).


## v0.26.4

- Fixed `RecordErrorEvent.Error` and `CollectionErrorEvent.Error` sync with `ModelErrorEvent.Error` ([#6639](https://github.com/pocketbase/pocketbase/issues/6639)).

- Fixed logs details copy to clipboard action.

- Updated `modernc.org/sqlite` to 1.36.2.


## v0.26.3

- Fixed and normalized logs error serialization across common types for more consistent logs error output ([#6631](https://github.com/pocketbase/pocketbase/issues/6631)).


## v0.26.2

- Updated `golang-jwt/jwt` dependency because it comes with a [minor security fix](https://github.com/golang-jwt/jwt/security/advisories/GHSA-mh63-6h87-95cp).


## v0.26.1

- Removed the wrapping of `io.EOF` error when reading files since currently `io.ReadAll` doesn't check for wrapped errors ([#6600](https://github.com/pocketbase/pocketbase/issues/6600)).


## v0.26.0

- ⚠️ Replaced `aws-sdk-go-v2` and `gocloud.dev/blob` with custom lighter implementation ([#6562](https://github.com/pocketbase/pocketbase/discussions/6562)).
    As a side-effect of the dependency removal, the binary size has been reduced with ~10MB and builds ~30% faster.
    _Although the change is expected to be backward-compatible, I'd recommend to test first locally the new version with your S3 provider (if you use S3 for files storage and backups)._

- ⚠️ Prioritized the user submitted non-empty `createData.email` (_it will be unverified_) when creating the PocketBase user during the first OAuth2 auth.

- Load the request info context during password/OAuth2/OTP authentication ([#6402](https://github.com/pocketbase/pocketbase/issues/6402)).
    This could be useful in case you want to target the auth method as part of the MFA and Auth API rules.
    For example, to disable MFA for the OAuth2 auth could be expressed as `@request.context != "oauth2"` MFA rule.

- Added `store.Store.SetFunc(key, func(old T) new T)` to set/update a store value with the return result of the callback in a concurrent safe manner.

- Added `subscription.Message.WriteSSE(w, id)` for writing an SSE formatted message into the provided writer interface (_used mostly to assist with the unit testing_).

- Added `$os.stat(file)` JSVM helper ([#6407](https://github.com/pocketbase/pocketbase/discussions/6407)).

- Added log warning for `async` marked JSVM handlers and resolve when possible the returned `Promise` as fallback ([#6476](https://github.com/pocketbase/pocketbase/issues/6476)).

- Allowed calling `cronAdd`, `cronRemove` from inside other JSVM handlers ([#6481](https://github.com/pocketbase/pocketbase/discussions/6481)).

- Bumped the default request read and write timeouts to 5mins (_old 3mins_) to accommodate slower internet connections and larger file uploads/downloads.
    _If you want to change them you can modify the `OnServe` hook's `ServeEvent.ReadTimeout/WriteTimeout` fields as shown in [#6550](https://github.com/pocketbase/pocketbase/discussions/6550#discussioncomment-12364515)._

- Normalized the `@request.auth.*` and `@request.body.*` back relations resolver to always return `null` when the relation field is pointing to a different collection ([#6590](https://github.com/pocketbase/pocketbase/discussions/6590#discussioncomment-12496581)).

- Other minor improvements (_fixed query dev log nested parameters output, reintroduced `DynamicModel` object/array props reflect types caching, updated Go and npm deps, etc._)


## v0.25.9

- Fixed `DynamicModel` object/array props reflect type caching ([#6563](https://github.com/pocketbase/pocketbase/discussions/6563)).


## v0.25.8

- Added a default leeway of 5 minutes for the Apple/OIDC `id_token` timestamp claims check to account for clock-skew ([#6529](https://github.com/pocketbase/pocketbase/issues/6529)).
    It can be further customized if needed with the `PB_ID_TOKEN_LEEWAY` env variable (_the value must be in seconds, e.g. "PB_ID_TOKEN_LEEWAY=60" for 1 minute_).


## v0.25.7

- Fixed `@request.body.jsonObjOrArr.*` values extraction ([#6493](https://github.com/pocketbase/pocketbase/discussions/6493)).


## v0.25.6

- Restore the missing `meta.isNew` field of the OAuth2 success response ([#6490](https://github.com/pocketbase/pocketbase/issues/6490)).

- Updated npm dependencies.


## v0.25.5

- Set the current working directory as a default goja script path when executing inline JS strings to allow `require(m)` traversing parent `node_modules` directories.

- Updated `modernc.org/sqlite` and `modernc.org/libc` dependencies.


## v0.25.4

- Downgraded `aws-sdk-go-v2` to the version before the default data integrity checks because there have been reports for non-AWS S3 providers in addition to Backblaze (IDrive, R2) that no longer or partially work with the latest AWS SDK changes.

    While we try to enforce `when_required` by default, it is not enough to disable the new AWS SDK integrity checks entirely and some providers will require additional manual adjustments to make them compatible with the latest AWS SDK (e.g. removing the `x-aws-checksum-*` headers, unsetting the checksums calculation or reinstantiating the old MD5 checksums for some of the required operations, etc.) which as a result leads to a configuration mess that I'm not sure it would be a good idea to introduce.

    This unfornuatelly is not a PocketBase or Go specific issue and the official AWS SDKs for other languages are in the same situation (even the latest aws-cli).

    For those of you that extend PocketBase with Go: if your S3 vendor doesn't support the [AWS Data integrity checks](https://docs.aws.amazon.com/sdkref/latest/guide/feature-dataintegrity.html) and you are updating with `go get -u`, then make sure that the `aws-sdk-go-v2` dependencies in your `go.mod` are the same as in the repo:
    ```
    // go.mod
    github.com/aws/aws-sdk-go-v2 v1.36.1
    github.com/aws/aws-sdk-go-v2/config v1.28.10
    github.com/aws/aws-sdk-go-v2/credentials v1.17.51
    github.com/aws/aws-sdk-go-v2/feature/s3/manager v1.17.48
    github.com/aws/aws-sdk-go-v2/service/s3 v1.72.2

    // after that run
    go clean -modcache && go mod tidy
    ```
    _The versions pinning is temporary until the non-AWS S3 vendors patch their implementation or until I manage to find time to remove/replace the `aws-sdk-go-v2` dependency (I'll consider prioritizing it for the v0.26 or v0.27 release)._


## v0.25.3

- Added a temporary exception for Backblaze S3 endpoints to exclude the new `aws-sdk-go-v2` checksum headers ([#6440](https://github.com/pocketbase/pocketbase/discussions/6440)).


## v0.25.2

- Fixed realtime delete event not being fired for `RecordProxy`-ies and added basic realtime record resolve automated tests ([#6433](https://github.com/pocketbase/pocketbase/issues/6433)).


## v0.25.1

- Fixed the batch API Preview success sample response.

- Bumped GitHub action min Go version to 1.23.6 as it comes with a [minor security fix](https://github.com/golang/go/issues?q=milestone%3AGo1.23.6+label%3ACherryPickApproved) for the ppc64le build.


## v0.25.0

- ⚠️ Upgraded Google OAuth2 auth, token and userinfo endpoints to their latest versions.
    _For users that don't do anything custom with the Google OAuth2 data or the OAuth2 auth URL, this should be a non-breaking change. The exceptions that I could find are:_
    - `/v3/userinfo` auth response changes:
        ```
        meta.rawUser.id             => meta.rawUser.sub
        meta.rawUser.verified_email => meta.rawUser.email_verified
        ```
    - `/v2/auth` query parameters changes:
        If you are specifying custom `approval_prompt=force` query parameter for the OAuth2 auth URL, you'll have to replace it with **`prompt=consent`**.

- Added Trakt OAuth2 provider ([#6338](https://github.com/pocketbase/pocketbase/pull/6338); thanks @aidan-)

- Added support for case-insensitive password auth based on the related UNIQUE index field collation ([#6337](https://github.com/pocketbase/pocketbase/discussions/6337)).

- Enforced `when_required` for the new AWS SDK request and response checksum validations to allow other non-AWS vendors to catch up with new AWS SDK changes (see [#6313](https://github.com/pocketbase/pocketbase/discussions/6313) and [aws/aws-sdk-go-v2#2960](https://github.com/aws/aws-sdk-go-v2/discussions/2960)).
    _You can set the environment variables `AWS_REQUEST_CHECKSUM_CALCULATION` and `AWS_RESPONSE_CHECKSUM_VALIDATION` to `when_supported` if your S3 vendor supports the [new default integrity protections](https://docs.aws.amazon.com/sdkref/latest/guide/feature-dataintegrity.html)._

- Soft-deprecated `Record.GetUploadedFiles` in favor of `Record.GetUnsavedFiles` to minimize the ambiguities what the method do ([#6269](https://github.com/pocketbase/pocketbase/discussions/6269)).

- Replaced archived `github.com/AlecAivazis/survey` dependency with a simpler  `osutils.YesNoPrompt(message, fallback)` helper.

- Upgraded to `golang-jwt/jwt/v5`.

- Added JSVM `new Timezone(name)` binding for constructing `time.Location` value ([#6219](https://github.com/pocketbase/pocketbase/discussions/6219)).

- Added `inflector.Camelize(str)` and `inflector.Singularize(str)` helper methods.

- Use the non-transactional app instance during the realtime records delete access checks to ensure that cascade deleted records with API rules relying on the parent will be resolved.

- Other minor improvements (_replaced all `bool` exists db scans with `int` for broader drivers compatibility, updated API Preview sample error responses, updated UI dependencies, etc._)


## v0.24.4

- Fixed fields extraction for view query with nested comments ([#6309](https://github.com/pocketbase/pocketbase/discussions/6309)).

- Bumped GitHub action min Go version to 1.23.5 as it comes with some [minor security fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.23.5).


## v0.24.3

- Fixed incorrectly reported unique validator error for fields starting with name of another field ([#6281](https://github.com/pocketbase/pocketbase/pull/6281); thanks @svobol13).

- Reload the created/edited records data in the RecordsPicker UI.

- Updated Go dependencies.


## v0.24.2

- Fixed display fields extraction when there are multiple "Presentable" `relation` fields in a single related collection ([#6229](https://github.com/pocketbase/pocketbase/issues/6229)).


## v0.24.1

- Added missing time macros in the UI autocomplete.

- Fixed JSVM types for structs and functions with multiple generic parameters.


## v0.24.0

- ⚠️ Removed the "dry submit" when executing the collections Create API rule
    (you can find more details why this change was introduced and how it could affect your app in https://github.com/pocketbase/pocketbase/discussions/6073).
    For most users it should be non-breaking change, BUT if you have Create API rules that uses self-references or view counters you may have to adjust them manually.
    With this change the "multi-match" operators are also normalized in case the targeted collection doesn't have any records
    (_or in other words, `@collection.example.someField != "test"` will result to `true` if `example` collection has no records because it satisfies the condition that all available "example" records mustn't have `someField` equal to "test"_).
    As a side-effect of all of the above minor changes, the record create API performance has been also improved ~4x times in high concurrent scenarios (500 concurrent clients inserting total of 50k records - [old (58.409064001s)](https://github.com/pocketbase/benchmarks/blob/54140be5fb0102f90034e1370c7f168fbcf0ddf0/results/hetzner_cax41_cgo.md#creating-50000-posts100k-reqs50000-conc500-rulerequestauthid----requestdatapublicisset--true) vs [new (13.580098262s)](https://github.com/pocketbase/benchmarks/blob/7df0466ac9bd62fe0a1056270d20ef82012f0234/results/hetzner_cax41_cgo.md#creating-50000-posts100k-reqs50000-conc500-rulerequestauthid----requestbodypublicisset--true)).

- ⚠️ Changed the type definition of `store.Store[T any]` to `store.Store[K comparable, T any]` to allow support for custom store key types.
    For most users it should be non-breaking change, BUT if you are calling `store.New[any](nil)` instances you'll have to specify the store key type, aka. `store.New[string, any](nil)`.

- Added `@yesterday` and `@tomorrow` datetime filter macros.

- Added `:lower` filter modifier (e.g. `title:lower = "lorem"`).

- Added `mailer.Message.InlineAttachments` field for attaching inline files to an email (_aka. `cid` links_).

- Added cache for the JSVM `arrayOf(m)`, `DynamicModel`, etc. dynamic `reflect` created types.

- Added auth collection select for the settings "Send test email" popup ([#6166](https://github.com/pocketbase/pocketbase/issues/6166)).

- Added `record.SetRandomPassword()` to simplify random password generation usually used in the OAuth2 or OTP record creation flows.
    _The generated ~30 chars random password is assigned directly as bcrypt hash and ignores the `password` field plain value validators like min/max length or regex pattern._

- Added option to list and trigger the registered app level cron jobs via the Web API and UI.

- Added extra validators for the collection field `int64` options (e.g. `FileField.MaxSize`) restricting them to the max safe JSON number (2^53-1).

- Added option to unset/overwrite the default PocketBase superuser installer using `ServeEvent.InstallerFunc`.

- Added `app.FindCachedCollectionReferences(collection, excludeIds)` to speedup records cascade delete almost twice for projects with many collections.

- Added `tests.NewTestAppWithConfig(config)` helper if you need more control over the test configurations like `IsDev`, the number of allowed connections, etc.

- Invalidate all record tokens when the auth record email is changed programmatically or by a superuser ([#5964](https://github.com/pocketbase/pocketbase/issues/5964)).

- Eagerly interrupt waiting for the email alert send in case it takes longer than 15s.

- Normalized the hidden fields filter checks and allow targetting hidden fields in the List API rule.

- Fixed "Unique identify fields" input not refreshing on unique indexes change ([#6184](https://github.com/pocketbase/pocketbase/issues/6184)).


## v0.23.12

- Added warning logs in case of mismatched `modernc.org/sqlite` and `modernc.org/libc` versions ([#6136](https://github.com/pocketbase/pocketbase/issues/6136#issuecomment-2556336962)).

- Skipped the default body size limit middleware for the backup upload endpoint ([#6152](https://github.com/pocketbase/pocketbase/issues/6152)).


## v0.23.11

- Upgraded `golang.org/x/net` to 0.33.0 to fix [CVE-2024-45338](https://www.cve.org/CVERecord?id=CVE-2024-45338).
  _PocketBase uses the vulnerable functions primarily for the auto html->text mail generation, but most applications shouldn't be affected unless you are manually embedding unrestricted user provided value in your mail templates._


## v0.23.10

- Renew the superuser file token cache when clicking on the thumb preview or download link ([#6137](https://github.com/pocketbase/pocketbase/discussions/6137)).

- Upgraded `modernc.org/sqlite` to 1.34.3 to fix "disk io" error on arm64 systems.
    _If you are extending PocketBase with Go and upgrading with `go get -u` make sure to manually set in your go.mod the `modernc.org/libc` indirect dependency to v1.55.3, aka. the exact same version the driver is using._


## v0.23.9

- Replaced `strconv.Itoa` with `strconv.FormatInt` to avoid the int64->int conversion overflow on 32-bit platforms ([#6132](https://github.com/pocketbase/pocketbase/discussions/6132)).


## v0.23.8

- Fixed Model->Record and Model->Collection hook events sync for nested and/or inner-hook transactions ([#6122](https://github.com/pocketbase/pocketbase/discussions/6122)).

- Other minor improvements (updated Go and npm deps, added extra escaping for the default mail record params in case the emails are stored as html files, fixed code comment typos, etc.).


## v0.23.7

- Fixed JSVM exception -> Go error unwrapping when throwing errors from non-request hooks ([#6102](https://github.com/pocketbase/pocketbase/discussions/6102)).


## v0.23.6

- Fixed `$filesystem.fileFromURL` documentation and generated type ([#6058](https://github.com/pocketbase/pocketbase/issues/6058)).

- Fixed `X-Forwarded-For` header typo in the suggested UI "Common trusted proxy" headers ([#6063](https://github.com/pocketbase/pocketbase/pull/6063)).

- Updated the `text` field max length validator error message to make it more clear ([#6066](https://github.com/pocketbase/pocketbase/issues/6066)).

- Other minor fixes (updated Go deps, skipped unnecessary validator check when the default primary key pattern is used, updated JSVM types, etc.).


## v0.23.5

- Fixed UI logs search not properly accounting for the "Include requests by superusers" toggle when multiple search expressions are used.

- Fixed `text` field max validation error message ([#6053](https://github.com/pocketbase/pocketbase/issues/6053)).

- Other minor fixes (comment typos, JSVM types update).

- Updated Go deps and the min Go release GitHub action version to 1.23.4.


## v0.23.4

- Fixed `autodate` fields not refreshing when calling `Save` multiple times on the same `Record` instance ([#6000](https://github.com/pocketbase/pocketbase/issues/6000)).

- Added more descriptive test OTP id and failure log message ([#5982](https://github.com/pocketbase/pocketbase/discussions/5982)).

- Moved the default UI CSP from meta tag to response header ([#5995](https://github.com/pocketbase/pocketbase/discussions/5995)).

- Updated Go and npm dependencies.


## v0.23.3

- Fixed Gzip middleware not applying when serving static files.

- Fixed `Record.Fresh()`/`Record.Clone()` methods not properly cloning `autodate` fields ([#5973](https://github.com/pocketbase/pocketbase/discussions/5973)).


## v0.23.2

- Fixed `RecordQuery()` custom struct scanning ([#5958](https://github.com/pocketbase/pocketbase/discussions/5958)).

- Fixed `--dev` log query print formatting.

- Added support for passing more than one id in the `Hook.Unbind` method for consistency with the router.

- Added collection rules change list in the confirmation popup
  (_to avoid getting anoying during development, the rules confirmation currently is enabled only when using https_).


## v0.23.1

- Added `RequestEvent.Blob(status, contentType, bytes)` response write helper ([#5940](https://github.com/pocketbase/pocketbase/discussions/5940)).

- Added more descriptive error messages.


## v0.23.0

> [!NOTE]
> You don't have to upgrade to PocketBase v0.23.0 if you are not planning further developing
> your existing app and/or are satisfied with the v0.22.x features set. There are no identified critical issues
> with PocketBase v0.22.x yet and in the case of critical bugs and security vulnerabilities, the fixes
> will be backported for at least until Q1 of 2025 (_if not longer_).
>
> **If you don't plan upgrading make sure to pin the SDKs version to their latest PocketBase v0.22.x compatible:**
> - JS SDK: `<0.22.0`
> - Dart SDK: `<0.19.0`

> [!CAUTION]
> This release introduces many Go/JSVM and Web APIs breaking changes!
>
> Existing `pb_data` will be automatically upgraded with the start of the new executable,
> but custom Go or JSVM (`pb_hooks`, `pb_migrations`) and JS/Dart SDK code will have to be migrated manually.
> Please refer to the below upgrade guides:
> - Go:   https://pocketbase.io/v023upgrade/go/.
> - JSVM: https://pocketbase.io/v023upgrade/jsvm/.
>
> If you had already switched to some of the earlier `<v0.23.0-rc14` versions and have generated a full collections snapshot migration (aka. `./pocketbase migrate collections`), then you may have to regenerate the migration file to ensure that it includes the latest changes.

PocketBase v0.23.0 is a major refactor of the internals with the overall goal of making PocketBase an easier to use Go framework.
There are a lot of changes but to highlight some of the most notable ones:

- New and more [detailed documentation](https://pocketbase.io/docs/).
  _The old documentation could be accessed at [pocketbase.io/old](https://pocketbase.io/old/)._
- Replaced `echo` with a new router built on top of the Go 1.22 `net/http` mux enhancements.
- Merged `daos` packages in `core.App` to simplify the DB operations (_the `models` package structs are also migrated in `core`_).
- Option to specify custom `DBConnect` function as part of the app configuration to allow different `database/sql` SQLite drivers (_turso/libsql, sqlcipher, etc._) and custom builds.
  _Note that we no longer loads the `mattn/go-sqlite3` driver by default when building with `CGO_ENABLED=1` to avoid `multiple definition` linker errors in case different CGO SQLite drivers or builds are used. You can find an example how to enable it back if you want to in the [new documentation](https://pocketbase.io/docs/go-overview/#github-commattngo-sqlite3)._
- New hooks allowing better control over the execution chain and error handling (_including wrapping an entire hook chain in a single DB transaction_).
- Various `Record` model improvements (_support for get/set modifiers, simplfied file upload by treating the file(s) as regular field value like `record.Set("document", file)`, etc._).
- Dedicated fields structs with safer defaults to make it easier creating/updating collections programmatically.
- Option to mark field as "Hidden", disallowing regular users to read or modify it (_there is also a dedicated Record hook to hide/unhide Record fields programmatically from a single place_).
- Option to customize the default system collection fields (`id`, `email`, `password`, etc.).
- Admins are now system `_superusers` auth records.
- Builtin rate limiter (_supports tags, wildcards and exact routes matching_).
- Batch/transactional Web API endpoint.
- Impersonate Web API endpoint (_it could be also used for generating fixed/non-refreshable superuser tokens, aka. "API keys"_).
- Support for custom user request activity log attributes.
- One-Time Password (OTP) auth method (_via email code_).
- Multi-Factor Authentication (MFA) support (_currently requires any 2 different auth methods to be used_).
- Support for Record "proxy/projection" in preparation for the planned autogeneration of typed Go record models.
- Linear OAuth2 provider ([#5909](https://github.com/pocketbase/pocketbase/pull/5909); thanks @chnfyi).
- WakaTime OAuth2 provider ([#5829](https://github.com/pocketbase/pocketbase/pull/5829); thanks @tigawanna).
- Notion OAuth2 provider ([#4999](https://github.com/pocketbase/pocketbase/pull/4999); thanks @s-li1).
- monday.com OAuth2 provider ([#5346](https://github.com/pocketbase/pocketbase/pull/5346); thanks @Jaytpa01).
- New Instagram provider compatible with the new Instagram Login APIs ([#5588](https://github.com/pocketbase/pocketbase/pull/5588); thanks @pnmcosta).
    _The provider key is `instagram2` to prevent conflicts with existing linked users._
- Option to retrieve the OIDC OAuth2 user info from the `id_token` payload for the cases when the provider doesn't have a dedicated user info endpoint.
- Various minor UI improvements (_recursive `Presentable` view, slightly different collection options organization, zoom/pan for the logs chart, etc._)
- and many more...

#### Go/JSVM APIs changes

> - Go:   https://pocketbase.io/v023upgrade/go/.
> - JSVM: https://pocketbase.io/v023upgrade/jsvm/.

#### SDKs changes

- [JS SDK v0.22.0](https://github.com/pocketbase/js-sdk/blob/master/CHANGELOG.md)
- [Dart SDK v0.19.0](https://github.com/pocketbase/dart-sdk/blob/master/CHANGELOG.md)

#### Web APIs changes

- New `POST /api/batch` endpoint.

- New `GET /api/collections/meta/scaffolds` endpoint.

- New `DELETE /api/collections/{collection}/truncate` endpoint.

- New `POST /api/collections/{collection}/request-otp` endpoint.

- New `POST /api/collections/{collection}/auth-with-otp` endpoint.

- New `POST /api/collections/{collection}/impersonate/{id}` endpoint.

- ⚠️ If you are constructing requests to `/api/*` routes manually remove the trailing slash (_there is no longer trailing slash removal middleware registered by default_).

- ⚠️ Removed `/api/admins/*` endpoints because admins are converted to `_superusers` auth collection records.

- ⚠️ Previously when uploading new files to a multiple `file` field, new files were automatically appended to the existing field values.
     This behaviour has changed with v0.23+ and for consistency with the other multi-valued fields when uploading new files they will replace the old ones. If you want to prepend or append new files to an existing multiple `file` field value you can use the `+` prefix or suffix:
     ```js
     "documents": [file1, file2]  // => [file1_name, file2_name]
     "+documents": [file1, file2] // => [file1_name, file2_name, old1_name, old2_name]
     "documents+": [file1, file2] // => [old1_name, old2_name, file1_name, file2_name]
     ```

- ⚠️ Removed `GET /records/{id}/external-auths` and `DELETE /records/{id}/external-auths/{provider}` endpoints because this is now handled by sending list and delete requests to the `_externalAuths` collection.

- ⚠️ Changes to the app settings model fields and response (+new options such as `trustedProxy`, `rateLimits`, `batch`, etc.). The app settings Web APIs are mostly used by the Dashboard UI and rarely by the end users, but if you want to check all settings changes please refer to the [Settings Go struct](https://github.com/pocketbase/pocketbase/blob/develop/core/settings_model.go#L121).

- ⚠️ New flatten Collection model and fields structure. The Collection model Web APIs are mostly used by the Dashboard UI and rarely by the end users, but if you want to check all changes please refer to the [Collection Go struct](https://github.com/pocketbase/pocketbase/blob/develop/core/collection_model.go#L308).

- ⚠️ The top level error response `code` key was renamed to `status` for consistency with the Go APIs.
    The error field key remains `code`:
    ```js
    {
        "status": 400, // <-- old: "code"
        "message": "Failed to create record.",
        "data": {
            "title": {
                "code": "validation_required",
                "message": "Missing required value."
            }
        }
    }
    ```

- ⚠️ New fields in the `GET /api/collections/{collection}/auth-methods` response.
    _The old `authProviders`, `usernamePassword`, `emailPassword` fields are still returned in the response but are considered deprecated and will be removed in the future._
    ```js
    {
        "mfa": {
            "duration": 100,
            "enabled": true
        },
        "otp": {
            "duration": 0,
            "enabled": false
        },
        "password": {
            "enabled": true,
            "identityFields": ["email", "username"]
        },
        "oauth2": {
            "enabled": true,
            "providers": [{"name": "gitlab", ...}, {"name": "google", ...}]
        },
        // old fields...
    }
    ```

- ⚠️ Soft-deprecated the OAuth2 auth success `meta.avatarUrl` field in favour of `meta.avatarURL`.

## v0.22.34

- (_Backported from v0.26.6_) Allow OIDC `email_verified` to be int or boolean string since some OIDC providers like AWS Cognito has non-standard userinfo response ([#6657](https://github.com/pocketbase/pocketbase/pull/6657)).


## v0.22.33

- (_Backported from v0.26.3_) Fixed and normalized logs error serialization across common types for more consistent logs error output ([#6631](https://github.com/pocketbase/pocketbase/issues/6631)).


## v0.22.32

- (_Backported from v0.26.2_) Updated `golang-jwt/jwt` dependency because it comes with a [minor security fix](https://github.com/golang-jwt/jwt/security/advisories/GHSA-mh63-6h87-95cp).


## v0.22.31

- (_Backported from v0.25.5_) Set the current working directory as a default goja script path when executing inline JS strings to allow `require(m)` traversing parent `node_modules` directories.


## v0.22.30

- (_Backported from v0.24.4_) Fixed fields extraction for view queries with nested comments ([#6309](https://github.com/pocketbase/pocketbase/discussions/6309)).

- Bumped GitHub action min Go version to 1.23.5 as it comes with some [minor security fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.23.5).


## v0.22.29

- (_Backported from v0.23.11_) Upgraded `golang.org/x/net` to 0.33.0 to fix [CVE-2024-45338](https://www.cve.org/CVERecord?id=CVE-2024-45338).
  _PocketBase uses the vulnerable functions primarily for the auto html->text mail generation, but most applications shouldn't be affected unless you are manually embedding unrestricted user provided value in your mail templates._


## v0.22.28

- (_Backported from v0.23.10_) Renew the superuser file token cache when clicking on the thumb preview or download link ([#6137](https://github.com/pocketbase/pocketbase/discussions/6137)).

- (_Backported from v0.23.10_) Upgraded `modernc.org/sqlite` to 1.34.3 to fix "disk io" error on arm64 systems.
  _If you are extending PocketBase with Go and upgrading with `go get -u` make sure to manually set in your go.mod the `modernc.org/libc` indirect dependency to v1.55.3, aka. the exact same version the driver is using._


## v0.22.27

- Instead of unregistering the realtime clients, we now just unset their auth state on delete of the related auth record so that the clients can receive the `delete` event ([#5898](https://github.com/pocketbase/pocketbase/issues/5898)).


## v0.22.26

- (_Backported from v0.23.0-rc_) Added manual WAL checkpoints before creating the zip backup to minimize copying unnecessary data.


## v0.22.25

- Refresh the old collections state in the Import UI after successful import submission ([#5861](https://github.com/pocketbase/pocketbase/issues/5861)).

- Added randomized throttle on failed filter list requests as a very rudimentary measure since some security researches raised concern regarding the possibity of eventual side-channel attacks.


## v0.22.24

- Delete new uploaded record files in case of DB persist error ([#5845](https://github.com/pocketbase/pocketbase/issues/5845)).


## v0.22.23

- Updated the hooks watcher to account for the case when hooksDir is a symlink ([#5789](https://github.com/pocketbase/pocketbase/issues/5789)).

- _(Backported from v0.23.0-rc)_ Registered a default `http.Server.ErrorLog` handler to report general server connection errors as app Debug level logs (e.g. invalid TLS handshakes caused by bots trying to access your server via its IP or other similar errors).

- Other minor fixes (updated npm dev deps to fix the vulnerabilities warning, added more user friendly realtime topic length error, regenerated JSVM types, etc.)


## v0.22.22

- Added deprecation log in case Instagram OAuth2 is used (_related to [#5652](https://github.com/pocketbase/pocketbase/discussions/5652)_).

- Added `update` command warning to prevent unnecessary downloading PocketBase v0.23.0 since it will contain breaking changes.

- Added global JSVM `toString()` helper (_successor of `readerToString()`_) to stringify any value (bool, number, multi-byte array, io.Reader, etc.).
  _`readerToString` is still available but it is marked as deprecated. You can also use `toString` as replacement for  of `String.fromCharCode` to properly stringify multi-byte unicode characters like emojis._
    ```js
    decodeURIComponent(escape(String.fromCharCode(...bytes))) -> toString(bytes)
    ```

- Updated `aws-sdk-go-v2` and removed deprecated `WithEndpointResolverWithOptions`.

- Backported some of the v0.23.0-rc form validators, fixes and tests.

- Bumped GitHub action min Go version and dependencies.


## v0.22.21

- Lock the logs database during backup to prevent `database disk image is malformed` errors in case there is a log write running in the background ([#5541](https://github.com/pocketbase/pocketbase/discussions/5541)).


## v0.22.20

- Fixed the Admin UI `isEmpty` check to allow submitting zero uuid, datetime and date strings ([#5398](https://github.com/pocketbase/pocketbase/issues/5398)).

- Updated goja and the other Go deps.


## v0.22.19

- Added additional parsing for the Apple OAuth2 `user` token response field to attempt returning the name of the authenticated user ([#5074](https://github.com/pocketbase/pocketbase/discussions/5074#discussioncomment-10317207)).
  _Note that Apple only returns the user object the first time the user authorizes the app (at least based on [their docs](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/configuring_your_webpage_for_sign_in_with_apple#3331292))._


## v0.22.18

- Improved files delete performance when using the local filesystem by adding a trailing slash to the `DeletePrefix` call to ensure that the list iterator will start "walking" from the prefix directory and not from its parent ([#5246](https://github.com/pocketbase/pocketbase/discussions/5246)).

- Updated Go deps.


## v0.22.17

- Updated the `editor` field to use the latest TinyMCE 6.8.4 and enabled `convert_unsafe_embeds:true` by default per the security advisories.
  _The Admin UI shouldn't be affected by the older TinyMCE because we don't use directly the vulnerable options/plugins and we have a default CSP, but it is recommended to update even just for silencing the CI/CD warnings._

- Disabled mouse selection when changing the sidebar width.
  _This should also fix the reported Firefox issue when the sidebar width "resets" on mouse release out of the page window._

- Other minor improvements (updated the logs delete check and tests, normalized internal errors formatting, updated Go deps, etc.)


## v0.22.16

- Fixed the days calculation for triggering old logs deletion ([#5179](https://github.com/pocketbase/pocketbase/pull/5179); thanks @nehmeroumani).
  _Note that the previous versions correctly delete only the logs older than the configured setting but due to the typo the delete query is invoked unnecessary on each logs batch write._


## v0.22.15

- Added mutex to `tests.TestMailer()` to minimize tests data race warnings ([#5157](https://github.com/pocketbase/pocketbase/issues/5157)).

- Updated goja and the other Go dependencies.

- Bumped the min Go version in the GitHub release action to Go 1.22.5 since it comes with [`net/http` security fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.22.5).


## v0.22.14

- Added OAuth2 POST redirect support (in case of `response_mode=form_post`) to allow specifying scopes for the Apple OAuth2 integration.

    Note 1: If you are using the "Manual code exchange" flow with Apple (aka. `authWithOAuth2Code()`), you need to either update your custom
    redirect handler to accept POST requests OR if you want to keep the old behavior and don't need the Apple user's email - replace in the Apple authorization url `response_mode=form_post` back to `response_mode=query`.

    Note 2: Existing users that have already logged in with Apple may need to revoke their access in order to see the email sharing options as shown in [this screenshot](https://github.com/pocketbase/pocketbase/discussions/5074#discussioncomment-9801855).
    If you want to force the new consent screen you could register a new Apple OAuth2 app.

- ⚠️ Fixed a security vulnerability related to the OAuth2 email autolinking (thanks to @dalurness for reporting it).

    Just to be safe I've also published a [GitHub security advisory](https://github.com/pocketbase/pocketbase/security/advisories/GHSA-m93w-4fxv-r35v) (_may take some time to show up in the related security databases_).

    In order to be exploited you must have **both** OAuth2 and Password auth methods enabled.

    A possible attack scenario could be:
    - a malicious actor register with the targeted user's email (it is unverified)
    - at some later point in time the targeted user stumble on your app and decides to sign-up with OAuth2 (_this step could be also initiated by the attacker by sending an invite email to the targeted user_)
    - on successful OAuth2 auth we search for an existing PocketBase user matching with the OAuth2 user's email and associate them
    - because we haven't changed the password of the existing PocketBase user during the linking, the malicious actor has access to the targeted user account and will be able to login with the initially created email/password

    To prevent this for happening we now reset the password for this specific case if the previously created user wasn't verified (an exception to this is if the linking is explicit/manual, aka. when you send `Authorization:TOKEN` with the OAuth2 auth call).

    Additionally to warn users we now send an email alert in case the user has logged in with password but has at least one OAuth2 account linked. It looks something like:

    _Hello,
    Just to let you know that someone has logged in to your Acme account using a password while you already have OAuth2 GitLab auth linked.
    If you have recently signed in with a password, you may disregard this email.
    **If you don't recognize the above action, you should immediately change your Acme account password.**
    Thanks,
    Acme team_

    The flow will be further improved with the [ongoing refactoring](https://github.com/pocketbase/pocketbase/discussions/4355) and we will start sending emails for "unrecognized device" logins (OTP and MFA is already implemented and will be available with the next v0.23.0 release in the near future).


## v0.22.13

- Fixed rules inconsistency for text literals when inside parenthesis ([#5017](https://github.com/pocketbase/pocketbase/issues/5017)).

- Updated Go deps.


## v0.22.12

- Fixed calendar picker grid layout misalignment on Firefox ([#4865](https://github.com/pocketbase/pocketbase/issues/4865)).

- Updated Go deps and bumped the min Go version in the GitHub release action to Go 1.22.3 since it comes with [some minor security fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.22.3).


## v0.22.11

- Load the full record in the relation picker edit panel ([#4857](https://github.com/pocketbase/pocketbase/issues/4857)).


## v0.22.10

- Updated the uploaded filename normalization to take double extensions in consideration ([#4824](https://github.com/pocketbase/pocketbase/issues/4824))

- Added Collection models cache to help speed up the common List and View requests execution with ~25%.
  _This was extracted from the ongoing work on [#4355](https://github.com/pocketbase/pocketbase/discussions/4355) and there are many other small optimizations already implemented but they will have to wait for the refactoring to be finalized._


## v0.22.9

- Fixed Admin UI OAuth2 "Clear all fields" btn action to properly unset all form fields ([#4737](https://github.com/pocketbase/pocketbase/issues/4737)).


## v0.22.8

- Fixed '~' auto wildcard wrapping when the param has escaped `%` character ([#4704](https://github.com/pocketbase/pocketbase/discussions/4704)).

- Other minor UI improvements (added `aria-expanded=true/false` to the dropdown triggers, added contrasting border around the default mail template btn style, etc.).

- Updated Go deps and bumped the min Go version in the GitHub release action to Go 1.22.2 since it comes with [some `net/http` security and bug fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.22.2).


## v0.22.7

- Replaced the default `s3blob` driver with a trimmed vendored version to reduce the binary size with ~10MB.
  _It can be further reduced with another ~10MB once we replace entirely the `aws-sdk-go-v2` dependency but I stumbled on some edge cases related to the headers signing and for now is on hold._

- Other minor improvements (updated GitLab OAuth2 provider logo [#4650](https://github.com/pocketbase/pocketbase/pull/4650), normalized error messages, updated npm dependencies, etc.)


## v0.22.6

- Admin UI accessibility improvements:
  - Fixed the dropdowns tab/enter/space keyboard navigation ([#4607](https://github.com/pocketbase/pocketbase/issues/4607)).
  - Added `role`, `aria-label`, `aria-hidden` attributes to some of the elements in attempt to better assist screen readers.


## v0.22.5

- Minor test helpers fixes ([#4600](https://github.com/pocketbase/pocketbase/issues/4600)):
  - Call the `OnTerminate` hook on `TestApp.Cleanup()`.
  - Automatically run the DB migrations on initializing the test app with `tests.NewTestApp()`.

- Added more elaborate warning message when restoring a backup explaining how the operation works.

- Skip irregular files (symbolic links, sockets, etc.) when restoring a backup zip from the Admin UI or calling `archive.Extract(src, dst)` because they come with too many edge cases and ambiguities.
  <details>
    <summary><b><i>More details</i></b></summary>

    This was initially reported as security issue (_thanks Harvey Spec_) but in the PocketBase context it is not something that can be exploited without an admin intervention and since the general expectations are that the PocketBase admins can do anything and they are the one who manage their server, this should be treated with the same diligence when using `scp`/`rsync`/`rclone`/etc. with untrusted file sources.

    It is not possible (_or at least I'm not aware how to do that easily_) to perform virus/malicious content scanning on the uploaded backup archive files and some caution is always required when using the Admin UI or running shell commands, hence the backup-restore warning text.

    **Or in other words, if someone sends you a file and tell you to upload it to your server (either as backup zip or manually via scp) obviously you shouldn't do that unless you really trust them.**

    PocketBase is like any other regular application that you run on your server and there is no builtin "sandbox" for what the PocketBase process can execute. This is left to the developers to restrict on application or OS level depending on their needs. If you are self-hosting PocketBase you usually don't have to do that, but if you are offering PocketBase as a service and allow strangers to run their own PocketBase instances on your server then you'll need to implement the isolation mechanisms on your own.
  </details>


## v0.22.4

- Removed conflicting styles causing the detailed codeblock log data preview to not visualize properly ([#4505](https://github.com/pocketbase/pocketbase/pull/4505)).

- Minor JSVM improvements:
  - Added `$filesystem.fileFromUrl(url, optSecTimeout)` helper.
  - Implemented the `FormData` interface and added support for sending `multipart/form-data` requests with `$http.send()` ([#4544](https://github.com/pocketbase/pocketbase/discussions/4544)).


## v0.22.3

- Fixed the z-index of the current admin dropdown on Safari ([#4492](https://github.com/pocketbase/pocketbase/issues/4492)).

- Fixed `OnAfterApiError` debug log `nil` error reference ([#4498](https://github.com/pocketbase/pocketbase/issues/4498)).

- Added the field name as part of the `@request.data.someRelField.*` join to handle the case when a collection has 2 or more relation fields pointing to the same place ([#4500](https://github.com/pocketbase/pocketbase/issues/4500)).

- Updated Go deps and bumped the min Go version in the GitHub release action to Go 1.22.1 since it comes with [some security fixes](https://github.com/golang/go/issues?q=milestone%3AGo1.22.1).


## v0.22.2

- Fixed a small regression introduced with v0.22.0 that was causing some missing unknown fields to always return an error instead of applying the specific `nullifyMisingField` resolver option to the query.


## v0.22.1

- Fixed Admin UI record and collection panels not reinitializing properly on browser back/forward navigation ([#4462](https://github.com/pocketbase/pocketbase/issues/4462)).

- Initialize `RecordAuthWithOAuth2Event.IsNewRecord` for the `OnRecordBeforeAuthWithOAuth2Request` hook ([#4437](https://github.com/pocketbase/pocketbase/discussions/4437)).

- Added error checks to the autogenerated Go migrations ([#4448](https://github.com/pocketbase/pocketbase/issues/4448)).


## v0.22.0

- Added Planning Center OAuth2 provider ([#4393](https://github.com/pocketbase/pocketbase/pull/4393); thanks @alxjsn).

- Admin UI improvements:
  - Autosync collection changes across multiple open browser tabs.
  - Fixed vertical image popup preview scrolling.
  - Added options to export a subset of collections.
  - Added option to import a subset of collections without deleting the others ([#3403](https://github.com/pocketbase/pocketbase/issues/3403)).

- Added support for back/indirect relation `filter`/`sort` (single and multiple).
  The syntax to reference back relation fields is `yourCollection_via_yourRelField.*`.
  ⚠️ To avoid excessive joins, the nested relations resolver is now limited to max 6 level depth (the same as `expand`).
  _Note that in the future there will be also more advanced and granular options to specify a subset of the fields that are filterable/sortable._

- Added support for multiple back/indirect relation `expand` and updated the keys to use the `_via_` reference syntax (`yourCollection_via_yourRelField`).
  _To minimize the breaking changes, the old parenthesis reference syntax (`yourCollection(yourRelField)`) will still continue to work but it is soft-deprecated and there will be a console log reminding you to change it to the new one._

- ⚠️ Collections and fields are no longer allowed to have `_via_` in their name to avoid collisions with the back/indirect relation reference syntax.

- Added `jsvm.Config.OnInit` optional config function to allow registering custom Go bindings to the JSVM.

- Added `@request.context` rule field that can be used to apply a different set of constraints based on the API rule execution context.
  For example, to disallow user creation by an OAuth2 auth, you could set for the users Create API rule `@request.context != "oauth2"`.
  The currently supported `@request.context` values are:
  ```
  default
  realtime
  protectedFile
  oauth2
  ```

- Adjusted the `cron.Start()` to start the ticker at the `00` second of the cron interval ([#4394](https://github.com/pocketbase/pocketbase/discussions/4394)).
  _Note that the cron format has only minute granularity and there is still no guarantee that the scheduled job will be always executed at the `00` second._

- Fixed auto backups cron not reloading properly after app settings change ([#4431](https://github.com/pocketbase/pocketbase/discussions/4431)).

- Upgraded to `aws-sdk-go-v2` and added special handling for GCS to workaround the previous [GCS headers signature issue](https://github.com/pocketbase/pocketbase/issues/2231) that we had with v2.
  _This should also fix the SVG/JSON zero response when using Cloudflare R2 ([#4287](https://github.com/pocketbase/pocketbase/issues/4287#issuecomment-1925168142), [#2068](https://github.com/pocketbase/pocketbase/discussions/2068), [#2952](https://github.com/pocketbase/pocketbase/discussions/2952))._
  _⚠️ If you are using S3 for uploaded files or backups, please verify that you have a green check in the Admin UI for your S3 configuration (I've tested the new version with GCS, MinIO, Cloudflare R2 and Wasabi)._

- Added `:each` modifier support for `file` and `relation` type fields (_previously it was supported only for `select` type fields_).

- Other minor improvements (updated the `ghupdate` plugin to use the configured executable name when printing to the console, fixed the error reporting of `admin update/delete` commands, etc.).


## v0.21.3

- Ignore the JS required validations for disabled OIDC providers ([#4322](https://github.com/pocketbase/pocketbase/issues/4322)).

- Allow `HEAD` requests to the `/api/health` endpoint ([#4310](https://github.com/pocketbase/pocketbase/issues/4310)).

- Fixed the `editor` field value when visualized inside the View collection preview panel.

- Manually clear all TinyMCE events on editor removal (_workaround for [tinymce#9377](https://github.com/tinymce/tinymce/issues/9377)_).


## v0.21.2

- Fixed `@request.auth.*` initialization side-effect which caused the current authenticated user email to not being returned in the user auth response ([#2173](https://github.com/pocketbase/pocketbase/issues/2173#issuecomment-1932332038)).
  _The current authenticated user email should be accessible always no matter of the `emailVisibility` state._

- Fixed `RecordUpsert.RemoveFiles` godoc example.

- Bumped to `NumCPU()+2` the `thumbGenSem` limit as some users reported that it was too restrictive.


## v0.21.1

- Small fix for the Admin UI related to the _Settings > Sync_ menu not being visible even when the "Hide controls" toggle is off.


## v0.21.0

- Added Bitbucket OAuth2 provider ([#3948](https://github.com/pocketbase/pocketbase/pull/3948); thanks @aabajyan).

- Mark user as verified on confirm password reset ([#4066](https://github.com/pocketbase/pocketbase/issues/4066)).
  _If the user email has changed after issuing the reset token (eg. updated by an admin), then the `verified` user state remains unchanged._

- Added support for loading a serialized json payload for `multipart/form-data` requests using the special `@jsonPayload` key.
  _This is intended to be used primarily by the SDKs to resolve [js-sdk#274](https://github.com/pocketbase/js-sdk/issues/274)._

- Added graceful OAuth2 redirect error handling ([#4177](https://github.com/pocketbase/pocketbase/issues/4177)).
  _Previously on redirect error we were returning directly a standard json error response. Now on redirect error we'll redirect to a generic OAuth2 failure screen (similar to the success one) and will attempt to auto close the OAuth2 popup._
  _The SDKs are also updated to handle the OAuth2 redirect error and it will be returned as Promise rejection of the `authWithOAuth2()` call._

- Exposed `$apis.gzip()` and `$apis.bodyLimit(bytes)` middlewares to the JSVM.

- Added `TestMailer.SentMessages` field that holds all sent test app emails until cleanup.

- Optimized the cascade delete of records with multiple `relation` fields.

- Updated the `serve` and `admin` commands error reporting.

- Minor Admin UI improvements (reduced the min table row height, added option to duplicate fields, added new TinyMCE codesample plugin languages, hide the collection sync settings when the `Settings.Meta.HideControls` is enabled, etc.)


## v0.20.7

- Fixed the Admin UI auto indexes update when renaming fields with a common prefix ([#4160](https://github.com/pocketbase/pocketbase/issues/4160)).


## v0.20.6

- Fixed JSVM types generation for functions with omitted arg types ([#4145](https://github.com/pocketbase/pocketbase/issues/4145)).

- Updated Go deps.


## v0.20.5

- Minor CSS fix for the Admin UI to prevent the searchbar within a popup from expanding too much and pushing the controls out of the visible area ([#4079](https://github.com/pocketbase/pocketbase/issues/4079#issuecomment-1876994116)).


## v0.20.4

- Small fix for a regression introduced with the recent `json` field changes that was causing View collection column expressions recognized as `json` to fail to resolve ([#4072](https://github.com/pocketbase/pocketbase/issues/4072)).


## v0.20.3

- Fixed the `json` field query comparisons to work correctly with plain JSON values like `null`, `bool` `number`, etc. ([#4068](https://github.com/pocketbase/pocketbase/issues/4068)).
  Since there are plans in the future to allow custom SQLite builds and also in some situations it may be useful to be able to distinguish `NULL` from `''`,
  for the `json` fields (and for any other future non-standard field) we no longer apply `COALESCE` by default, aka.:
  ```
  Dataset:
  1) data: json(null)
  2) data: json('')

  For the filter "data = null" only 1) will resolve to TRUE.
  For the filter "data = ''"   only 2) will resolve to TRUE.
  ```

- Minor Go tests improvements
  - Sorted the record cascade delete references to ensure that the delete operation will preserve the order of the fired events when running the tests.
  - Marked some of the tests as safe for parallel execution to speed up a little the GitHub action build times.


## v0.20.2

- Added `sleep(milliseconds)` JSVM binding.
  _It works the same way as Go `time.Sleep()`, aka. it pauses the goroutine where the JSVM code is running._

- Fixed multi-line text paste in the Admin UI search bar ([#4022](https://github.com/pocketbase/pocketbase/discussions/4022)).

- Fixed the monospace font loading in the Admin UI.

- Fixed various reported docs and code comment typos.


## v0.20.1

- Added `--dev` flag and its accompanying `app.IsDev()` method (_in place of the previously removed `--debug`_) to assist during development ([#3918](https://github.com/pocketbase/pocketbase/discussions/3918)).
  The `--dev` flag prints in the console "everything" and more specifically:
  - the data DB SQL statements
  - all `app.Logger().*` logs (debug, info, warning, error, etc.), no matter of the logs persistence settings in the Admin UI

- Minor Admin UI fixes:
  - Fixed the log `error` label text wrapping.
  - Added the log `referer` (_when it is from a different source_) and `details` labels in the logs listing.
  - Removed the blank current time entry from the logs chart because it was causing confusion when used with custom time ranges.
  - Updated the SQL syntax highlighter and keywords autocompletion in the Admin UI to recognize `CAST(x as bool)` expressions.

- Replaced the default API tests timeout with a new `ApiScenario.Timeout` option ([#3930](https://github.com/pocketbase/pocketbase/issues/3930)).
  A negative or zero value means no tests timeout.
  If a single API test takes more than 3s to complete it will have a log message visible when the test fails or when `go test -v` flag is used.

- Added timestamp at the beginning of the generated JSVM types file to avoid creating it everytime with the app startup.


## v0.20.0

- Added `expand`, `filter`, `fields`, custom query and headers parameters support for the realtime subscriptions.
    _Requires JS SDK v0.20.0+ or Dart SDK v0.17.0+._

    ```js
    // JS SDK v0.20.0
    pb.collection("example").subscribe("*", (e) => {
      ...
    }, {
      expand: "someRelField",
      filter: "status = 'active'",
      fields: "id,expand.someRelField.*:excerpt(100)",
    })
    ```

    ```dart
    // Dart SDK v0.17.0
    pb.collection("example").subscribe("*", (e) {
        ...
      },
      expand: "someRelField",
      filter: "status = 'active'",
      fields: "id,expand.someRelField.*:excerpt(100)",
    )
    ```

- Generalized the logs to allow any kind of application logs, not just requests.

    The new `app.Logger()` implements the standard [`log/slog` interfaces](https://pkg.go.dev/log/slog) available with Go 1.21.
    ```
    // Go: https://pocketbase.io/docs/go-logging/
    app.Logger().Info("Example message", "total", 123, "details", "lorem ipsum...")

    // JS: https://pocketbase.io/docs/js-logging/
    $app.logger().info("Example message", "total", 123, "details", "lorem ipsum...")
    ```

    For better performance and to minimize blocking on hot paths, logs are currently written with
    debounce and on batches:
    - 3 seconds after the last debounced log write
    - when the batch threshold is reached (currently 200)
    - right before app termination to attempt saving everything from the existing logs queue

    Some notable log related changes:

    - ⚠️ Bumped the minimum required Go version to 1.21.

    - ⚠️ Removed `_requests` table in favor of the generalized `_logs`.
      _Note that existing logs will be deleted!_

    - ⚠️ Renamed the following `Dao` log methods:
      ```go
      Dao.RequestQuery(...)      -> Dao.LogQuery(...)
      Dao.FindRequestById(...)   -> Dao.FindLogById(...)
      Dao.RequestsStats(...)     -> Dao.LogsStats(...)
      Dao.DeleteOldRequests(...) -> Dao.DeleteOldLogs(...)
      Dao.SaveRequest(...)       -> Dao.SaveLog(...)
      ```
    - ⚠️ Removed `app.IsDebug()` and the `--debug` flag.
      This was done to avoid the confusion with the new logger and its debug severity level.
      If you want to store debug logs you can set `-4` as min log level from the Admin UI.

    - Refactored Admin UI Logs:
      - Added new logs table listing.
      - Added log settings option to toggle the IP logging for the activity logger.
      - Added log settings option to specify a minimum log level.
      - Added controls to export individual or bulk selected logs as json.
      - Other minor improvements and fixes.

- Added new `filesystem/System.Copy(src, dest)` method to copy existing files from one location to another.
  _This is usually useful when duplicating records with `file` field(s) programmatically._

- Added `filesystem.NewFileFromUrl(ctx, url)` helper method to construct a `*filesystem.BytesReader` file from the specified url.

- OAuth2 related additions:

    - Added new `PKCE()` and `SetPKCE(enable)` OAuth2 methods to indicate whether the PKCE flow is supported or not.
      _The PKCE value is currently configurable from the UI only for the OIDC providers._
      _This was added to accommodate OIDC providers that may throw an error if unsupported PKCE params are submitted with the auth request (eg. LinkedIn; see [#3799](https://github.com/pocketbase/pocketbase/discussions/3799#discussioncomment-7640312))._

    - Added new `displayName` field for each `listAuthMethods()` OAuth2 provider item.
      _The value of the `displayName` property is currently configurable from the UI only for the OIDC providers._

    - Added `expiry` field to the OAuth2 user response containing the _optional_ expiration time of the OAuth2 access token ([#3617](https://github.com/pocketbase/pocketbase/discussions/3617)).

    - Allow a single OAuth2 user to be used for authentication in multiple auth collection.
      _⚠️ Because now you can have more than one external provider with `collectionId-provider-providerId` pair, `Dao.FindExternalAuthByProvider(provider, providerId)` method was removed in favour of the more generic `Dao.FindFirstExternalAuthByExpr(expr)`._

- Added `onlyVerified` auth collection option to globally disallow authentication requests for unverified users.

- Added support for single line comments (ex. `// your comment`) in the API rules and filter expressions.

- Added support for specifying a collection alias in `@collection.someCollection:alias.*`.

- Soft-deprecated and renamed `app.Cache()` with `app.Store()`.

- Minor JSVM updates and fixes:

    - Updated `$security.parseUnverifiedJWT(token)` and `$security.parseJWT(token, key)` to return the token payload result as plain object.

    - Added `$apis.requireGuestOnly()` middleware JSVM binding ([#3896](https://github.com/pocketbase/pocketbase/issues/3896)).

- Use `IS NOT` instead of `!=` as not-equal SQL query operator to handle the cases when comparing with nullable columns or expressions (eg. `json_extract` over `json` field).
  _Based on my local dataset I wasn't able to find a significant difference in the performance between the 2 operators, but if you stumble on a query that you think may be affected negatively by this, please report it and I'll test it further._

- Added `MaxSize` `json` field option to prevent storing large json data in the db ([#3790](https://github.com/pocketbase/pocketbase/issues/3790)).
  _Existing `json` fields are updated with a system migration to have a ~2MB size limit (it can be adjusted from the Admin UI)._

- Fixed negative string number normalization support for the `json` field type.

- Trigger the `app.OnTerminate()` hook on `app.Restart()` call.
  _A new bool `IsRestart` field was also added to the `core.TerminateEvent` event._

- Fixed graceful shutdown handling and speed up a little the app termination time.

- Limit the concurrent thumbs generation to avoid high CPU and memory usage in spiky scenarios ([#3794](https://github.com/pocketbase/pocketbase/pull/3794); thanks @t-muehlberger).
  _Currently the max concurrent thumbs generation processes are limited to "total of logical process CPUs + 1"._
  _This is arbitrary chosen and may change in the future depending on the users feedback and usage patterns._
  _If you are experiencing OOM errors during large image thumb generations, especially in container environment, you can try defining the `GOMEMLIMIT=500MiB` env variable before starting the executable._

- Slightly speed up (~10%) the thumbs generation by changing from cubic (`CatmullRom`) to bilinear (`Linear`) resampling filter (_the quality difference is very little_).

- Added a default red colored Stderr output in case of a console command error.
  _You can now also silence individually custom commands errors using the `cobra.Command.SilenceErrors` field._

- Fixed links formatting in the autogenerated html->text mail body.

- Removed incorrectly imported empty `local('')` font-face declarations.


## v0.19.4

- Fixed TinyMCE source code viewer textarea styles ([#3715](https://github.com/pocketbase/pocketbase/issues/3715)).

- Fixed `text` field min/max validators to properly count multi-byte characters ([#3735](https://github.com/pocketbase/pocketbase/issues/3735)).

- Allowed hyphens in `username` ([#3697](https://github.com/pocketbase/pocketbase/issues/3697)).
  _More control over the system fields settings will be available in the future._

- Updated the JSVM generated types to use directly the value type instead of `* | undefined` union in functions/methods return declarations.


## v0.19.3

- Added the release notes to the console output of `./pocketbase update` ([#3685](https://github.com/pocketbase/pocketbase/discussions/3685)).

- Added missing documentation for the JSVM `$mails.*` bindings.

- Relaxed the OAuth2 redirect url validation to allow any string value ([#3689](https://github.com/pocketbase/pocketbase/pull/3689); thanks @sergeypdev).
  _Note that the redirect url format is still bound to the accepted values by the specific OAuth2 provider._


## v0.19.2

- Updated the JSVM generated types ([#3627](https://github.com/pocketbase/pocketbase/issues/3627), [#3662](https://github.com/pocketbase/pocketbase/issues/3662)).


## v0.19.1

- Fixed `tokenizer.Scan()/ScanAll()` to ignore the separators from the default trim cutset.
  An option to return also the empty found tokens was also added via `Tokenizer.KeepEmptyTokens(true)`.
  _This should fix the parsing of whitespace characters around view query column names when no quotes are used ([#3616](https://github.com/pocketbase/pocketbase/discussions/3616#discussioncomment-7398564))._

- Fixed the `:excerpt(max, withEllipsis?)` `fields` query param modifier to properly add space to the generated text fragment after block tags.


## v0.19.0

- Added Patreon OAuth2 provider ([#3323](https://github.com/pocketbase/pocketbase/pull/3323); thanks @ghostdevv).

- Added mailcow OAuth2 provider ([#3364](https://github.com/pocketbase/pocketbase/pull/3364); thanks @thisni1s).

- Added support for `:excerpt(max, withEllipsis?)` `fields` modifier that will return a short plain text version of any string value (html tags are stripped).
    This could be used to minimize the downloaded json data when listing records with large `editor` html values.
    ```js
    await pb.collection("example").getList(1, 20, {
      "fields": "*,description:excerpt(100)"
    })
    ```

- Several Admin UI improvements:
  - Count the total records separately to speed up the query execution for large datasets ([#3344](https://github.com/pocketbase/pocketbase/issues/3344)).
  - Enclosed the listing scrolling area within the table so that the horizontal scrollbar and table header are always reachable ([#2505](https://github.com/pocketbase/pocketbase/issues/2505)).
  - Allowed opening the record preview/update form via direct URL ([#2682](https://github.com/pocketbase/pocketbase/discussions/2682)).
  - Reintroduced the local `date` field tooltip on hover.
  - Speed up the listing loading times for records with large `editor` field values by initially fetching only a partial of the records data (the complete record data is loaded on record preview/update).
  - Added "Media library" (collection images picker) support for the TinyMCE `editor` field.
  - Added support to "pin" collections in the sidebar.
  - Added support to manually resize the collections sidebar.
  - More clear "Nonempty" field label style.
  - Removed the legacy `.woff` and `.ttf` fonts and keep only `.woff2`.

- Removed the explicit `Content-Type` charset from the realtime response due to compatibility issues with IIS ([#3461](https://github.com/pocketbase/pocketbase/issues/3461)).
  _The `Connection:keep-alive` realtime response header was also removed as it is not really used with HTTP2 anyway._

- Added new JSVM bindings:
  - `new Cookie({ ... })` constructor for creating `*http.Cookie` equivalent value.
  - `new SubscriptionMessage({ ... })` constructor for creating a custom realtime subscription payload.
  - Soft-deprecated `$os.exec()` in favour of `$os.cmd()` to make it more clear that the call only prepares the command and doesn't execute it.

- ⚠️ Bumped the min required Go version to 1.19.