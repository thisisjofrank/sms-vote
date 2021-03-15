import Head from 'next/head';
import styles from '../styles/Home.module.css';
import dynamic from 'next/dynamic';
//import QuestionsComponent from '../components/QuestionsComponent.jsx';

const QuestionsComponent = dynamic(() => import('../components/QuestionsComponent'), { ssr: false });

export async function getStaticProps(context) {
  const response = await fetch('https://opentdb.com/api.php?amount=50&difficulty=medium&type=multiple');
  const questions = (await response.json()).results;
  return { props: { questions } };
}

export default function Home({ questions }) {

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>Text +33 644 634 209<br/>To see your message on this page</h1>
        <QuestionsComponent questions={questions} />
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
