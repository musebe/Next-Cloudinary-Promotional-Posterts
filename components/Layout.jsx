import Head from "next/head";
import Link from "next/link";

const LayoutComponent = (props) => {
  const { children } = props;

  return (
    <div>
      <Head>
        <title>Generate promotional poster with cloudinary</title>
        <meta
          name="description"
          content="Generate promotional poster with cloudinary"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/images">
          <a>Images</a>
        </Link>
      </nav>
      <main>{children}</main>
      <style jsx>{`
        nav {
          min-height: 100px;
          background-color: var(--primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        nav a {
          color: white;
          margin: 0 10px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default LayoutComponent;
