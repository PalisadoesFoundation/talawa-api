import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Talawa API Documentation',
  tagline: 'Start your open source journey here',
  favicon: 'img/favicon.ico',

  url: 'https://docs-api.talawa.io',
  baseUrl: '/',
  deploymentBranch: 'gh-pages',

  organizationName: 'PalisadoesFoundation', // GitHub org
  projectName: 'talawa-api', // repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/PalisadoesFoundation/talawa-api/blob/main/docs/',        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Talawa-docs',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logos/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {
          label: "Mobile Guide",
          position: "left",
          href: "https://docs-mobile.talawa.io/",
          target: "_blank",
        },
        {
          label: "Admin Guide",
          position: "left",
          href: "https://docs-admin.talawa.io/",
          target: "_blank",
        },
        {
          label: "API Guide",
          position: "left",
          href: "https://docs-api.talawa.io/",
          target: "_self",
        },
        {
          label: "Demo",
          position: "left",
          href: "http://admin-demo.talawa.io/",
        },
        {
          to: "https://github.com/PalisadoesFoundation",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
        {
          to: "https://www.youtube.com/@PalisadoesOrganization",
          position: "right",
          className: "header-youtube-link",
          "aria-label": "Palisadoes Youtube channel",
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: "Slack",
              to: "https://github.com/PalisadoesFoundation",
              className: "footer__icon footer__slack",
            },
            {
              label: "News",
              to: "https://www.palisadoes.org/news/",
              className: "footer__icon footer__news",
            },
            {
              label: "Contact Us",
              to: "https://www.palisadoes.org/contact/",
              className: "footer__icon footer__contact",
            },
          ],
        },
        {
          title: "Social Media",
          items: [
            {
              label: " Twitter",
              to: "https://twitter.com/palisadoesorg?lang=en",
              className: "footer__icon footer__twitter",
            },
            {
              label: " Facebook",
              to: "https://www.facebook.com/palisadoesproject/",
              className: "footer__icon footer__facebook",
            },
            {
              label: " Instagram",
              to: "https://www.instagram.com/palisadoes/?hl=en",
              className: "footer__icon footer__instagram",
            }
          ],
        },
        {
          title: "Development",
          items: [
            {
              label: " GitHub",
              to: "https://github.com/PalisadoesFoundation",
              className: "footer__icon footer__github",
            },
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
