import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * React hook that keeps track of the total number of users that currently have
 * the website open ("online"). It leverages Supabase Realtime Presence under a
 * single channel ("online-users").
 *
 * Every browser tab gets a random UUID (stored in sessionStorage) so refreshing
 * the page keeps the same presence key, while opening a new tab counts as a
 * separate online user.
 */
export function useOnlineUsers(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Generate / reuse a stable presence key for this tab
    const presenceKey = (() => {
      const cached = sessionStorage.getItem('presence-key');
      if (cached) return cached;
      const key = uuidv4();
      sessionStorage.setItem('presence-key', key);
      return key;
    })();

    // Create a realtime channel with presence enabled
    const channel = supabase.channel('online-users', {
      config: {
        presence: { key: presenceKey }
      }
    });

    // Track myself once subscribed
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({}); // no extra payload needed
      }
    });

    // Whenever the presence state changes, recalculate the count
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const uniqueUsers = Object.keys(state);
      setCount(uniqueUsers.length);
    });

    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, []);

  return count;
}
