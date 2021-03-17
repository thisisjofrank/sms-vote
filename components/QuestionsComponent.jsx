import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './QuestionsComponent.module.css';

const question = {
    text: "What is the best biscuit?",
    options: [
        { key: "A", text: "Jammy Dodger", votes: 0, src: "images/jamiedodger.jpg" },
        { key: "B", text: "Oreo", votes: 0, src: "images/oreo.jpg" },
        { key: "C", text: "Bourbon", votes: 0, src: "images/bourbon.jpg" },
        { key: "D", text: "Custard cream", votes: 0, src: "images/custardcream.jpg" }
    ]
};

const QuestionsComponent = () => {

    // question should be got from props
    // default state should be got from question passed in props

    const defaultState = question.options.map(x => x.key);
    console.log(defaultState);

    const [votes, setVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });

    const [channel, ably] = useChannel("sms-notifications", (message) => {       
        const sms = unpackSms(message);
        const value = sms.text?.trim()?.toUpperCase() ?? "";

        console.log("updating", sms, votes);

        const updatedVotes = { ...votes };
        updatedVotes[value]++;
        setVotes(updatedVotes);
    });

    const displayItems = question.options.map(opt => 
        <li key={ opt.key } className={styles.answer}>
            <span className={styles.text}>{opt.text}</span> 
            <span className={styles.votes}>Votes: { opt.votes }</span> 
            <img className={styles.image} src={ opt.src } alt={ opt.text } />
            <span className={styles.letter}>{ opt.key }</span>
        </li>
    );


    return (
    <>
        <h1 className={styles.question}>{ question.text } - { votes.A } - { votes.B } - { votes.C } - { votes.D }</h1>
        <ul className={styles.answers}>
            {displayItems}
        </ul>
    </>
    );
}


function unpackSms(message) {
    console.log(message);
    let from = [message.data.from.slice(0, 2) + " " + message.data.from.slice(2, 6) +  " " + message.data.from.slice(6, 9) + " "+ message.data.from.slice(9)];
    let date = new Date(message.data.timestamp);
    let day = date.toDateString().replace(/^\S+\s/,'');
    let time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = message.data.text;
    return { from, date, day, time, text };
}

export default QuestionsComponent; 