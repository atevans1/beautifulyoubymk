# Launch readiness checklist

## Security and privacy

- [ ] Confirm the production Supabase project and apply migrations after review.
- [ ] Add authenticated server-side admin checks and role policies.
- [ ] Verify help requests, cases, donor records and applications are never public.
- [ ] Confirm rate limiting, validation, audit logging, backups and retention.
- [ ] Confirm no secrets or service-role keys are present in source or browser code.

## Accessibility

- [ ] Test keyboard navigation and visible focus states.
- [ ] Test headings, labels, error messages and Quick Exit with a screen reader.
- [ ] Verify contrast in both light and dark themes.
- [ ] Add approved image alt text and consent records for every published photograph.

## SEO and performance

- [ ] Run Lighthouse on the deployed domain for mobile and desktop.
- [ ] Verify canonical URLs, sitemap and robots rules.
- [ ] Keep Get Help, admin, case and beneficiary routes `noindex`.
- [ ] Confirm compressed images, cache headers and acceptable Core Web Vitals.
- [ ] Check analytics does not capture confidential form content.

## Content governance

- [ ] Replace all organisation-specific placeholders with approved wording.
- [ ] Publish only consented stories, photographs and verified impact metrics.
- [ ] Confirm donation provider, legal policies, emergency contacts and public locations.
