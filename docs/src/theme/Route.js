import Head from '@docusaurus/Head';

export default function Root({ children }) {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://docs.talawa.io/assets/css/styles.css"
        />
      </Head>
      {children}
    </>
  );
}
