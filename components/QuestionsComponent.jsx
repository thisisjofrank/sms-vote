import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './QuestionsComponent.module.css';

const question = {
    text: "What is the best biscuit?",
    options: [
        { key: "A", text: "Digestive", votes: 0 },
        { key: "B", text: "Hobnob", votes: 0 },
        { key: "C", text: "Bourbon", votes: 0 },
        { key: "D", text: "Custard creme", votes: 0 }
    ]
};

const QuestionsComponent = () => {

    const [votes, setVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });

    const [channel, ably] = useChannel("sms-notifications", (message) => {       
        const sms = unpackSms(message);
        const value = sms.text?.trim()?.toUpperCase() ?? "";

        console.log("updating", sms, votes);

        const updatedVotes = { ...votes };
        updatedVotes[value]++;
        setVotes(updatedVotes);
    });

    const displayItems = question.options.map(opt => <li key={ opt.key } className={styles.answer}>{opt.text}, Votes: { opt.votes }</li>);


    return (
    <>
        <h1>{ question.text } - { votes.A } - { votes.B } - { votes.C } - { votes.D }</h1>
        <ul>
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