import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>WildRandom Admin</title>
        <meta name="description" content="WildRandom Administrative Interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">WildRandom Admin</h1>
          <p className="mt-4 text-gray-600">New Implementation</p>
        </div>
      </div>
    </>
  )
}

export default Home