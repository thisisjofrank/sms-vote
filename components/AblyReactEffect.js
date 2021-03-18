import Ably from "ably/promises";
import { useEffect, useState } from 'react'

const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

export function useChannel(channelName, callbackOnMessage, rewind = false) {
    const rewindParam = "[?rewind=1]";
    const getChannel = rewind ? rewindParam + channelName : channelName;
    const channel = ably.channels.get(getChannel);

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