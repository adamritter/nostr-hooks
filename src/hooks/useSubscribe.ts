import { Event } from 'nostr-tools';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Config } from '../types';

import { useNostrStore } from '../store';

import { generateSubId } from '../utils';

const useSubscribe = ({ filters, relays, options }: Config) => {
  const subId = useRef(generateSubId());
  const shouldCreateSub = useRef(true);

  const handleSub = useNostrStore(useCallback((store) => store.handleNewSub, []));
  const handleUnSub = useNostrStore(useCallback((store) => store.unSub, []));
  const sub = useNostrStore(
    useCallback((store) => store.subMap.get(subId.current), [subId.current])
  );
  const events = useNostrStore(
    useCallback(
      (store) => {
        const subscribedEvents = [] as Event[];
        store.eventMap.forEach((subIds, event) => {
          if (subIds.has(subId.current)) {
            subscribedEvents.push(event);
          }
        });

        return subscribedEvents;
      },
      [subId.current]
    )
  );

  const invalidate = useCallback(() => {
    shouldCreateSub.current = false;
    handleSub(
      { filters, relays, options: { ...options, invalidate: true, force: true } },
      subId.current
    );
  }, [shouldCreateSub.current, filters, relays, options, handleSub, subId.current]);

  useEffect(() => {
    if (options?.enabled === false) {
      shouldCreateSub.current = false;
      return;
    }

    if (options?.invalidate === true) {
      shouldCreateSub.current = true;
      return;
    }

    if (sub) {
      shouldCreateSub.current = false;
      return;
    }

    shouldCreateSub.current = true;
  }, [options?.enabled, options?.invalidate]);

  useEffect(() => {
    if (shouldCreateSub.current) {
      shouldCreateSub.current = false;
      handleSub({ filters, relays, options }, subId.current);
    }
  }, [shouldCreateSub.current, filters, relays, options, handleSub, subId.current]);

  useEffect(() => {
    return () => {
      handleUnSub(subId.current);
    };
  }, [handleUnSub, subId.current]);

  return {
    events,
    eose: sub?.eose || false,
    invalidate,
  };
};

export default useSubscribe;
