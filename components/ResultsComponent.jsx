import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './ResultsComponent.module.css';
import { parseSms } from "./parseSms";

const ResultsComponent = ({ question }) => {

    const initialScores = {};
    question.options.map(x => x.key).forEach(i => initialScores[i] = 0);

    const [votes, setVotes] = useState(initialScores);

    useChannel("sms-notifications", (message) => {
        const sms = parseSms(message);
        const value = sms.text.toUpperCase();

        const updatedVotes = { ...votes };
        updatedVotes[value]++;
        setVotes(updatedVotes);
    });

    // These have .votes and .votePercentage properties in them now x
    const itemsForDisplay = decorateOptionsWithVotes(question.options, votes);

    const displayItems = itemsForDisplay.map(opt => 
        <li key={ opt.key } className={styles.vote} title={opt.text}>
            <span className={styles.number}>{ opt.votes }</span> 
            <span className={styles.bar} style={{ height: opt.votePercentage}}></span>
        </li>
    );

    return (
    <>
        <ul className={styles.votes}>
            {displayItems}
        </ul>
    </>
    );
}

function decorateOptionsWithVotes(options, votes) {
    const totalVotes = Object.values(votes).reduce((a,b) => a+b);
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