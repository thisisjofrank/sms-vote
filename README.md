# Building a Realtime SMS voting app with Next.js, Ably, Vercel and Vonage

https://next-js-chat-app.vercel.app/

This is a demo of building a SMS voting application with [Next.js](https://nextjs.org/) using Ably as the messaging platform.

You'll learn how to -

* Create a brand new Next.js application
* Create an Ably account and get an API key
* Create a Next.js Vercel Serverless API
* Buy a phone number using Vonage
* Configure Vonage to forward SMS data as a web hook
* Use React Functional components and React Hooks with Ably
* Host your app on Vercel

[Next.js](https://nextjs.org/) is a React framework from [Vercel](https://vercel.com/). It is used to build static web applications with server side rendering, serverless functions and seamless hosting. It's a framework that takes the React knowledge you already have, and puts some structure and conventions in place.

[Ably](https://www.ably.io/) is realtime, pub/sub messaging platform with a suite of integrated services to deliver complete realtime functionality directly to end-users.

[Vercel](https://vercel.com/) is a hosting platform, built from the ground up to host Next.js apps, and Serverless Functions with them.

[React](https://reactjs.org/) is a JavaScript library for building user interfaces with encapsulated components that manage their own state.

[Vonage](https://www.vonage.co.uk/) is an SMS gateway provider.

# WebSockets in Vercel with Ably

![Vercel and Websockets](https://cdn.glitch.com/0cb30add-c9ef-4c00-983c-e12deb0d4080%2Fvercel-websockets.png?v=1610475709091)

Vercel allows users to deploy [Serverless Functions](https://vercel.com/docs/serverless-functions/introduction), which are essentially just blocks of code which provide a response to an HTTP request. However, these functions have a maximum execution timeout, which means that it is not possible to maintain a WebSocket connection this way. 

This is where Ably comes in. The client can connect to an [Ably Channel](https://www.ably.io/documentation/realtime/channels) and send and receive messages on it to add Realtime functionality to your app by managing your WebSocket connections for you. We'll go over how to build an app which uses realtime functionality in this walkthrough, if preferred, you can [jump straight to how to use Ably with Vercel](#ablyandvercel).

# What are we going to build?

We'll build a realtime sms voting app that runs in the browser. The app will present a question to the viewers, and they'll be prompted to send text messages using their mobile phone to vote for an answer - A, B, C or D.

In real-time, as SMS messages are received, charts of the vote breakdown will appear in the app.

It will be built upon the Next.js [create-next-app](https://nextjs.org/docs/api-reference/create-next-app) template, it will contain a React component which will use Ably to receive messages. 

We'll write a Next.js serverless function which will be used to connect to Ably, and to receive forwarded SMS messages from Vonage.


## Dependencies

In order to build this app, you will need:

* **An Ably account** for sending messages: [Create an account with Ably for free](https://www.ably.io/signup).
* **A Vercel Account** for hosting on production: [Create an account with Vercel for free](https://vercel.com/signup).
* **A Vonage Account** for creating a phone number.
* **Node 12** (LTS) or greater: [Install Node](https://nodejs.org/en/).

## Local dev pre-requirements

You'll need an API key from Ably to authenticate with the Ably Service. To get an API key, once you have [created an Ably account](https://www.ably.io/signup):

1. Visit your [app dashboard](https://www.ably.io/accounts/any) and click on "Create New App".
2. Give the new app a name
3. Copy the Private API key once the app has been created. Keep it safe, this is how you will authenticate with the Ably service.

Vercel provides some Next.js command line tools to help us. They don't need to be installed on your system as they're executed using `npx`.

# Building the Realtime SMS voting app
### To create the starter app:

1. In your terminal, type `npx create-next-app` to create an empty Next.js app.
2. Create a file called `.env` in the root of the directory, this is where we'll put the project's environment variables.
3. Add your Ably API key to the .env file:
```
ABLY_API_KEY=your-ably-api-key:goes-here
```
4. Navigate to your Next.js application directory and type into the console:

```bash
npm run dev
```

The Next.js dev server will spin up and you'll see an empty Next.JS starter app. This is what we'll build our sms voting app on top of.

# Realtime Pub/Sub messaging with Ably

The sms voting app we'll build uses [Ably](https://www.ably.io/) for [pub/sub messaging](https://www.ably.io/documentation/core-features/pubsub) between the users. Pub/Sub stands for Publish and Subscribe, and it is a popular pattern used for realtime data delivery. The app will be able to send, or `publish` messages over an [Ably Channel](https://www.ably.io/channels). The clients that use the app will be `subscribed` to the channel and will be able to receive the messages. We'll build a UI to create messages to be sent, and to display messages as they are received.

## Authentication with the Ably service

Vercel Next.js apps don't run traditional "server side code", however, you can add JavaScript files to `/pages/api/*` and the Vercel deployment engine will treat each one as an API endpoint and manage them as serverless functions for you.

For local development, the Next.js tools run these functions in a Node server, so they work as you would expect in your local dev environment. We're going to add a Next.js / Vercel serverless function to the starter code that we created earlier to authenticate our app with Ably, and make it possible to start sending and receiving messages over the Ably service.

## <a name="ablyandvercel">Writing the Serverless function to connect to Ably</a>

You'll need to install the [Ably npm package](https://www.npmjs.com/package/ably/v/1.2.5-beta.1) (it's important you're running Ably 1.2.5+ for this app, for compatibility with Vercel). 

In the terminal, in the root of your new app run:

```bash
npm install ably@1.2.5-beta.1
```

Next, create a file called `./pages/api/createTokenRequest.js` into which add the following code:

```js
import Ably from "ably/promises";

export default async function handler(req, res) {
    const client = new Ably.Realtime(process.env.ABLY_API_KEY);
    const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'ably-nextjs-demo' });
    res.status(200).json(tokenRequestData);
};
```

This serverless function uses the Ably SDK to create a `tokenRequest` with your API key. This token will be used later - it allows you to keep your "real" API key safe while using it in the Next.js app. By default, this API is configured to be available on `http://localhost:3000/api/createTokenRequest`
We're going to provide this URL to the Ably SDK in our client to authenticate with Ably.


# The Realtime SMS voting app Architecture

The topology of our Next.js app will look like this:

```bash
├─ .env
├─ .gitignore
├─ package-lock.json
├─ package.json
├─ README.md   
|    
├─── components
│     ├─ QuestionComponent.jsx
│     ├─ QuestionComponent.module.css
│     ├─ ResultsComponent.jsx
│     ├─ ResultsComponent.module.css
│     ├─ AblyReactEffect.js
│     └─ parseSms.js
|
├─── pages
│    ├─ index.js
│    │   
│    └─── api
│          ├─ acceptWebhook.js
│          └─ createTokenRequest.js
│           
└─── public
```

* `/pages/index.js` is the home page
* `/api/acceptWebhook.js` is our SMS receiving API for Vonage to call
* `/api/createTokenRequest.js` is our Ably token authentication API
* `/components/QuestionComponent.jsx` is our UI rendering logic for votable questions
* `/components/QuestionComponent.module.css` contains the styles for the QuestionComponent
* `/components/ResultsComponent.jsx` is the results component
* `/components/ResultsComponent.module.css` contains the styles for the results component
* `/components/AblyReactEffect.js` is the Ably React Hook.
* `/components/parseSms.js` is the SMS unpacker.

Let's walk through how this application is built.

# Building the Components

Pages in `Next.js` are React components, so the `pages/index.js` home page is the React component that contains the page layout.

This is the default page generated by `create-next-app`, we'll add our own components to this - a `QuestionsComponent` and a `ResultsComponent`:

```jsx
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import dynamic from 'next/dynamic';

import QuestionsComponent from "../components/QuestionComponent";
const ResultsComponent = dynamic(() => import('../components/ResultsComponent'), { ssr: false });

export default function Home() {
    
  const question = getQuestion();

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
      <header className={styles.header}>
        <img src="/images/smsvote.svg" alt="sms vote" className={styles.logo}/>
        <h1 className={styles.title}>Text: (+33) 644 63 42 09<br />to vote</h1>
      </header>
        <QuestionsComponent question={question} />
        <ResultsComponent question={question} />
      </main>

      <footer className={styles.footer}>
        <a href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app" target="_blank" rel="noopener noreferrer">
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}

// We're just hard-coding this question here for now.
// It's a very important question.

function getQuestion() {    
  return {
    text: "Which biscuit is best?",
    options: [
        { key: "A", text: "Jammy Dodger", votes: 0, src: "images/jamiedodger.jpg" },
        { key: "B", text: "Oreo", votes: 0, src: "images/oreo.jpg" },
        { key: "C", text: "Bourbon", votes: 0, src: "images/bourbon.jpg" },
        { key: "D", text: "Custard cream", votes: 0, src: "images/custardcream.jpg" }
    ]
  };
}

```

You'll notice that our ResultsComponent doesn't look like a regular import - we're including it like this:

```jsx
const ResultsComponent = dynamic(() => import('../components/ResultsComponent'), { ssr: false });
```

before using it like any other react component:

```jsx
    <ResultsComponent question={question} />
    </main>
```

This unusual include style is because the `ResultsComponent` can only be run inside the user's browser. It connects using WebSockets and isn't suitable for Server Side Rendering with Vercel. By default, Next.js attempts to render everything on the server side, so by including the component using a `dynamic()` call, we can tell Next.js not to render this during the build process, where it would throw errors because it can't connect to the APIs that it needs to function.

# Presenting our question with QuestionComponent

You might have noticed in our `index.js` page, we used our `QuestionComponent` and passed the hard-coded question as `React props`.

Our `QuestionComponent` is responsible for taking that question, and rendering our options to the screen. This is a simple stateless `react` component only concerned with layout.

```jsx
import styles from './QuestionComponent.module.css';

const QuestionComponent = ({ question }) => {

    const itemsForDisplay = question.options;

    const displayItems = itemsForDisplay.map(opt => 
        <li key={ opt.key } className={styles.answer}>
            <span className={styles.text}>{opt.text}</span> 
            <img className={styles.image} src={ opt.src } alt={ opt.text } />
            <span className={styles.letter}>{ opt.key }</span>
        </li>
    );

    return (
    <>
        <h1 className={styles.question}>{ question.text }</h1>
        <ul className={styles.answers}>
            {displayItems}
        </ul>
    </>
    );
}

export default QuestionComponent; 
```

We're iterating over our `question.options` - the answers we want our users to vote on - and building a list to display.

# Receiving an SMS using Vonage and Vercel

Vonage allows you to configure mobile phone numbers in their API dashboard that will trigger your own APIs when messages are received.

To do this, we need to add a `Vercel Serverless function` to our `Next.js` app. This serverless function will get called by `Vonage` each time an SMS is received (once we setup a phone number!) and we're going to put some code in the function to unpack this SMS message, and send it to our `React app` using an `Ably channel`.

This process is quite similar to the setup for our Ably `createTokenRequest`. 

Create a file called `./pages/api/acceptWebhook.js` into which add the following code:

```js
import Ably from "ably/promises";

export default async function handler(req, res) {

    // Unpack the SMS details from the request query string
    const incomingData = getSmsDetails(req, res);

    // If the request was invalid, return status 400.
    if (!incomingData.success) {
        res.status(400).end();
        return;
    }

    // Create an Ably client, get our `sms-notifications` channel
    const client = new Ably.Realtime(process.env.ABLY_API_KEY);
    const channel = client.channels.get("sms-notifications");

    // Publish our SMS contents as an Ably message for the browser
    await channel.publish({ name: "smsEvent", data: incomingData });

    // Return the received data as a 200 OK for debugging.
    res.send(incomingData);
    res.status(200).end();
};

function getSmsDetails(req, res) {

    const params = req.query;

    if (!params.to || !params.msisdn) {
        console.log('This is not a valid inbound SMS message!');
        return { success: false };
    }

    return {
        success: true,
        messageId: params.messageId,
        from: params.msisdn,
        text: params.text,
        type: params.type,
        timestamp: params['message-timestamp']
    };
}
```

We're going to move back to the app for now, but we'll come back to this function at the end once our app is deployed to `Vercel` and our function has a `public url`.

# Reacting to SMS messages with the ResultsComponent

The sms voting app logic is contained inside the `ResultsComponent.jsx` component.

Start off by referencing the imports we'll need at the top of the file:

```jsx
import React, { useEffect, useState } from 'react';
import { useChannel, readLastAblyMessage, leadingClientSends } from "./AblyReactEffect";
import styles from './ResultsComponent.module.css';
import { parseSms } from "./parseSms";
```

Then we'll define the function that will be exported as a React Functional component.

We're also going to use the react props - a single `question` and create a default `initialScores` object to keep track of our user votes.

```jsx
const ResultsComponent = ({ question }) => {

    const initialScores = {};
    question.options.map(x => x.key).forEach(i => initialScores[i] = 0);    
```

We're doing this by looping over each option a user can vote on, and creating a set of zero scores for each option.

For our hard-coded question, these two lines will create an object that looks like: `{ A: 0, B: 0, C: 0, D: 0 }`

Next, set up the state properties that we'll use in the component:

```jsx
    const [votes, setVotes] = useState(initialScores);
```

and we'll use our first `custom react hook` called `readLastAblyMessage`.

```jsx
    const [statusChannel] = readLastAblyMessage("sms-notifications-votes", async (lastMessage) => {
        setVotes(lastMessage.data);
    });
```

`readLastAblyMessage` does exactly what it sounds like - when our component mounts, it'll read the last Ably message sent to the channel `sms-notifications-votes` - we're calling `setVotes` with this message to make sure new clients joining our app keep in sync with their peers.

Now we'll make use of the `useChannel` hook that we imported earlier.

`useChannel` is a [react-hook](https://reactjs.org/docs/hooks-intro.html) style API for subscribing to messages from an Ably channel. You provide it with a channel name and a callback to be invoked whenever a message is received.

```jsx
    const [channel, ably] = useChannel("sms-notifications", async (message) => {
        // First we parse and normalise our SMS using the code in parseSms.js
        // This code converts our dates into a human readable format
        // and makes sure our strings are all trimmed.
        const sms = parseSms(message);
        const value = sms.text.toUpperCase();

        // Next, we read the upper cased value from our SMS - expected to be A-D
        // We then clone our votes object, and increment whichever option the user
        // voted for, before calling setVotes again to update the votes stored
        // in our state.
        const updatedVotes = { ...votes };
        updatedVotes[value]++;
        setVotes(updatedVotes);

        // And finally, we publish the updated votes to the `voteSummary` channel
        // so any new joiners can load this state when they first load
        // the application.
        statusChannel.publish({ name: "voteSummary", data: updatedVotes });
    });
```

Now, we're going to format our data model for the screen, so we can display the questions, along with the votes.

```jsx
    const totalVotes = getTotalVotes(votes);
    const itemsForDisplay = decorateOptionsWithVotes(question.options, votes);
    
    const displayItems = itemsForDisplay.map(opt => 
        <li key={ opt.key } className={styles.vote} title={opt.text}>
            <span className={styles.number}>{ opt.votes }</span> 
            <span className={styles.bar} style={{ height: opt.votePercentage}}></span>
        </li>
    );
```

We're summing the total number of votes in our state for display, as well as calling a function called `decorateOptionsWithVotes` - which takes our possible answers, and adds the number of votes and the total percentage of votes each has received to make our `displayItems` easier to calculate.

Finally we create our component and return it:

```jsx

    return (
    <>
        <ul className={styles.votes}>
            {displayItems}
        </ul>
        <div className={styles.total}>Total votes: <b>{totalVotes}</b></div>
    </>
    );
}
```

Followed by defining our helper functions that we called earlier:

```jsx
function getTotalVotes(votes) {
    return Object.values(votes).reduce((a,b) => a+b);
}

function decorateOptionsWithVotes(options, votes) {
    const totalVotes = getTotalVotes(votes);
    const optionsWithVotes = [...options ];

    optionsWithVotes.forEach(option => {
        const voteCount = votes[option.key];
        const percent = totalVotes === 0 ? 0 : (voteCount / totalVotes) * 100;       
        option.votes = voteCount;
        option.votePercentage = Math.floor(percent) + "%";
    });

    return optionsWithVotes;
}

export default ResultsComponent; 
```

Right at the bottom of the file, the function is exported as `ResultsComponent` so that it can be referenced in the Next.js page we created at the start.

## Using Ably correctly in React Components

One of the trickier parts of using Ably with React Functional Components is knowing when and where to create the instance of the SDK and when and where to connect to your channel(s). You will want to avoid instancing the SDK when the component is rendered as this could make multiple connections and burn through your Ably account limits.

To make sure that the app handles component redrawing, mounting and unmounting correctly - `AblyReactEffect` exports a [React Hook](https://reactjs.org/docs/hooks-intro.html) to interact with the Ably SDK.

React hooks can seem a little unusual the first time you use them. A hook is a function which:

* Executes the functionality that we'd expect `componentDidMount` to run
* Returns *another* function that will be executed by the framework where `componentDidUnmount` would be called
* Performs any other behaviour it needs to

This React Hook is built upon `useEffect`. When referenced, it creates an instance of the Ably SDK (it does this only once) which is configured to use the `URL` of your Serverless function to `createTokenRequest` for authentication:

```js
import Ably from "ably/promises";
import { useEffect } from 'react'

const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });
```

Instancing the Ably library outside the scope of the component will mean it is only created once and will keep your limit usage down.

We then need to create the function we're going to export - our Hook, so that we can use it in our components.
We'll call it `useChannel` and it will require the channel name, and a callback as arguments. Each time `useChannel` is called, we [`get` the requested channel](https://www.ably.io/documentation/realtime/channels#obtaining-channel) from the Ably-JS SDK and prepare the hook functions.

* **onMount** is the code run each time our component is rendered. Inside onMount, we will subscribe to the specified channel, triggering `callbackOnMessage` whenever a message is received. 
* **onUnmount** is the code run whenever the component is unmounted before it is re-rendered. Here we will unsubscribe from the channel, which will stop accidental multiples of connections, again saving our account limits.
* **useEffectHook** is a function that calls these functions correctly, returning onUnmount for React to use.

The exported Hook in `AblyReactEffect.js` will look like this: 

```js
export function useChannel(channelName, callbackOnMessage) {
    const channel = ably.channels.get(channelName);

    const onMount = () => {
        channel.subscribe(msg => { callbackOnMessage(msg); });
    }

    const onUnmount = () => {
        channel.unsubscribe();
    }

    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    useEffect(useEffectHook);

    return [channel, ably];
}
```

The `useChannel` Hook returns both the current Ably channel and the Ably SDK for the calling code to use to send messages. This hook encapsulates Ably pub/sub for React functional components in one place, so we don't need to worry about it elsewhere, and the code that uses it can just process the messages it receives.

Our `AblyReactEffect.js` file also exports a second hook called `readLastAblyMessage`:

```js
export function readLastAblyMessage(channelName, callbackOnMessage) {
    const [synced, setSynced] = useState(false);
    
    const [statusChannel, ably] = useChannel(channelName, async (message) => {
    
         if (!synced) {
            setSynced(true);
            await callbackOnMessage(message);
        }
    }, true);
    
    return [statusChannel, ably];
}
```

This hook actually uses `useChannel` under the hood, and invokes its callback **only for the first message** received on the channel. We use this in conjunction with an Ably settings that means that the last message on a channel is stored and returned for `one year`.

This means we can use a secondary channel to synchronise state when new clients join our app.

## Making everything look beautiful with module CSS - `QuestionComponent.module.css` and `ResultsComponent.module.css`

You might have noticed when writing the chat component that `Next.js` has some compiler enforced conventions that dictate where you keep your CSS and how to import it.
For this app, we will create a CSS file with the same name as the `.jsx` file, just with the extensions `.module.css`. We do this to keep management of the components easier, if in the future we want to delete this component it is nice and simple to also remove its CSS. Once created, it can be imported into the component:

```js
import styles from './ResultsComponent.module.css';
```

When creating a CSS class on a JSX element, we use the following syntax on the element:

```js
 className={styles.yourClassName}
```

and the accompanying css would look like this:

```css
.yourClassName {
  styles: gohere;
}
```
This app is built with [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) to create the app layout, you are of course welcome to use the CSS provided with this project or to write your own or use a framework.

# Hosting on Vercel

We're using `Vercel` as our development server and build pipeline.

> The easiest way to deploy Next.js to production is to use the Vercel platform from the creators of Next.js. Vercel is an all-in-one platform with Global CDN supporting static & Jamstack deployment and Serverless Functions.
<cite>-- [The Next.js documentation](https://nextjs.org/docs/deployment)</cive>

In order to deploy your new sms voting app to Vercel you'll need to:

1. Create a [GitHub account](https://github.com/) (if you don't already have one)
2. [Push your app to a GitHub repository](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-new-repository)
3. [Create a Vercel account](https://vercel.com/signup)
4. Create a new Vercel app and import your app from your GitHub repository. (This will require you to authorise Vercel to use your GitHub account)
5. Add your `ABLY_API_KEY` as an environment variable
6. Watch your app deploy
7. Visit the newly created URL in your browser!


# Setting up an SMS number for your app

For this demo to work, you'll need to buy an inexpensive `phone number` from Vonage.

We went with a $1/month Irish phone number - as it supported sending and receiving SMS messages, and there were plenty available to buy in the Vonage API dashboard.

First, you'll need to sign up or login to Vonage by visiting [Vonage APIs](http://dashboard.nexmo.com/).

Once you've created and verified your account, you can buy a number by going to: Numbers => Buy Numbers. Search for a number that works for you and add some credits to pay for the number.

Irish numbers are good because they're cheap!

Once you've purchased your number, you need to configure the `SMS Inbound Webhook URL`.

You can do this by going to: Numbers => Your Numbers => Clicking the pen icon.

You'll be greeted with a modal dialog box, and you need to put your `acceptWebhook` API url into the box.

If your Vercel app is called `your-vercel-app`, the webhook URL would be `https://[your-vercel-app].vercel.app/api/acceptWebhook`

# Make it yours!

This demo is open source, fork it and make it your own. Don't forget to show us what you build [@ablyRealtime](https://twitter.com/ablyrealtime).

If you're looking for ways to extend this project you could consider:

* supporting multiple questions.
* supporting text in the answers, instead of just a single character.
* adding a database to store votes for longer term.
* adding in an option to vote in a browser.
* sending a response text to the voters to thank them or let them know if their answer was correct.

# Let us Know

If this tutorial was helpful, or you're using Next.js and Ably in your project, we'd love to hear about it. Drop us a [message on Twitter](https://twitter.com/ablyrealtime) or email us at [devrel@ably.io](mailto:devrel@ably.io).
