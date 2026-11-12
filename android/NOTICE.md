# Android wrapper provenance

The Android source project was generated with GoogleChromeLabs Bubblewrap
`@bubblewrap/core` **1.27.0** from the application's production web manifest.
Upstream Apache-2.0 headers are preserved; see [LICENSE-BUBBLEWRAP](LICENSE-BUBBLEWRAP).
The Gradle wrapper is the upstream Gradle 8.11.1 bootstrap, with its official
SHA-256 distribution checksum pinned in `gradle-wrapper.properties`.

Project-specific changes: a distinct preview package/name, disposable debug
signing, shared JSON configuration, SDK/build-tools 36, Maven Central in place of
JCenter, release lint enabled, isolated key/build output paths and artifact
inspection. Browser rendering, audio and storage remain in the hosted web app.
No native player, billing, ads SDK or location delegation is added.

PNG launcher/splash assets are generated from this project's existing PWA icons.
Android Browser Helper **2.7.4** is a build dependency retrieved from Google's
Maven repository. Dependency sources/licenses remain with their publishers.
