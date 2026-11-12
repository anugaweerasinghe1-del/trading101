# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/feea23e6-63bb-40bf-9f5d-cdd132b90ddc

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/feea23e6-63bb-40bf-9f5d-cdd132b90ddc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/feea23e6-63bb-40bf-9f5d-cdd132b90ddc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)


## Publishing What’s New

Approved published courses flow into the journey and What’s New automatically from the public catalog; unapproved AI drafts never appear. Major user-facing product releases use the owner-reviewed [approved release manifest](src/content/releases/approved.json), which is bundled only by the deployment containing that change. Set `announce: true` for a recent, dismissible once-per-browser popup; otherwise the entry remains in the timeline without a popup. Keep a stable ID, date, plain-language benefit, valid page link, and action. Routine fixes, individual daily exercises and unpublished features are not announced. Never infer approvals from every code commit. Older entries remain in [releaseNotes.ts](src/lib/releaseNotes.ts).

## Advertising audience decision required before activation

N-M04 remains an owner decision, not a finding that TradeHQ is automatically child-directed.
As verified on 10 October 2026, `index.html` loads the real AdSense script and publisher metadata, and `ads.txt` contains the publisher record. Script loading does not establish account approval or ad serving. Verify the account's actual status and audience settings before making advertising changes:

- Record the intended audience and whether any site or section is child-directed; student wording alone is insufficient to decide this.
- Review current Google age-treatment requirements and configure the applicable signals and advertising protections for that audience. Unknown age must not be silently treated as verified adult age.
- Assess optional account data, public profiles and consented analytics/session replay for the intended audience. Do not assume advertising consent proves age.
- Confirm the publisher account and Google-certified CMP separately.

No age gate, authentication change or backend configuration was introduced by this documentation.
Reference: https://support.google.com/publisherpolicies/answer/10436800
