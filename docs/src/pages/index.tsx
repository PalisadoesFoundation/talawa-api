import React from "react";
import Head from "@docusaurus/Head";
import Layout from "@theme/Layout";
import useHomePageAnimations  from "../hooks/useHomePageAnimations";
import  HeaderHero  from "../components/layout/HeaderHero";
import  SecondPanel  from "../components/layout/SecondPanel";
import  ThirdPanel  from "../components/layout/ThirdPanel";
import  FourthPanel  from "../components/layout/FourthPanel";
import  FifthPanel  from "../components/layout/FifthPanel";
import  SixthPanel  from "../components/layout/SixthPanel";
import  SeventhPanel  from "../components/layout/SeventhPanel";
import  EighthPanel  from "../components/layout/EightPanel";

const Index = () => {
  useHomePageAnimations();

  const pageTitle = "Talawa-Docs: Powered by The Palisadoes";

  return (
    <Layout description="Powering Closer Communities" wrapperClassName="homepage">
      <Head>
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <meta property="twitter:title" content={pageTitle} />
      </Head>
      <HeaderHero />
      <SecondPanel/>
      <ThirdPanel />
      <FourthPanel />
      <FifthPanel />
      <SixthPanel />
      <SeventhPanel />
      <EighthPanel />
    </Layout>
  );
};

export default Index;
