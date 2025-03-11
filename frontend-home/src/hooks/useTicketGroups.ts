// src/hooks/useTicketGroups.ts
import { useCallback, useState, useEffect, useRef } from 'react';
import TicketGroupsAPI from '../api/ticketGroupsApi';
import { useAtom } from 'jotai';
import { ticketGroupsStateAtom, setGroupsAtom, setLoadingAtom, setErrorAtom } from '../stores/ticketGroups';
import type { TicketGroup } from '../api/types/ticketGroups';

export const useTicketGroups = () => {
  // Use the global Jotai state
  const [state] = useAtom(ticketGroupsStateAtom);
  const [, setGroups] = useAtom(setGroupsAtom);
  const [, setLoading] = useAtom(setLoadingAtom);
  const [, setError] = useAtom(setErrorAtom);
  
  const isMounted = useRef(true);
  const pendingFetch = useRef(false);
  const initialFetchDone = useRef(false);

  const fetchGroups = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (pendingFetch.current) {
      console.log("Fetch already in progress, skipping");
      return [];
    }
    
    // Prevent repeated fetches unless forced
    if (!force && initialFetchDone.current && state.groups.length > 0) {
      console.log("Using cached ticket groups - skip fetch");
      return state.groups;
    }
    
    console.log("Ticket groups fetch initiated");
    pendingFetch.current = true;
    
    // Update global store loading state
    setLoading(true);
    
    try {
      const response = await TicketGroupsAPI.getTicketGroups({
        include_metrics: true
      });
      
      console.log("API response received:", response);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch ticket groups');
      }
      
      // Extract data from the wrapped response
      const ticketGroups = response.data || [];
      
      if (isMounted.current) {
        console.log(`Processing ${ticketGroups.length} ticket groups`);
        // Update the global store with the new data
        setGroups(ticketGroups);
        initialFetchDone.current = true;
      }
      
      return ticketGroups;
    } catch (err) {
      console.error("Error fetching ticket groups:", err);
      
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket groups');
      }
      
      return [];
    } finally {
      if (isMounted.current) {
        pendingFetch.current = false;
      }
    }
  }, [state.groups, setGroups, setLoading, setError]);

  // Set up component lifecycle refs
  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      pendingFetch.current = false;
    };
  }, []);

  // Initial data fetch - ONLY ONCE
  useEffect(() => {
    // Only fetch if we haven't done an initial fetch and don't have data
    if (!initialFetchDone.current && state.groups.length === 0) {
      console.log("Performing initial ticket groups fetch");
      fetchGroups(true).catch(console.error);
    }
  }, [fetchGroups, state.groups.length]);
  
  return {
    groups: state.groups,
    isLoading: state.isLoading,
    error: state.error,
    fetchGroups
  };
};

export default useTicketGroups;