export function parseSms(message) {
    console.log(message);
    let from = [message.data.from.slice(0, 2) + " " + message.data.from.slice(2, 6) +  " " + message.data.from.slice(6, 9) + " "+ message.data.from.slice(9)];
    let date = new Date(message.data.timestamp);
    let day = date.toDateString().replace(/^\S+\s/,'');
    let time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = (message.data.text || "").trim();
    return { from, date, day, time, text };
}