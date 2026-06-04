import { useState, useCallback, useRef } from "react";
import { getFeed } from "@/services/supabase/feed/feed.queries";
import { FeedPost } from "@/services/supabase/feed/feed.types";

interface UseFeedState {
    items: FeedPost[];
    isLoading: boolean;
    isFetchingMore: boolean;
    error: string | null;
    hasMore: boolean;
}

interface UseFeedReturn extends UseFeedState {
    refresh: () => Promise<void>;
    fetchMore: () => Promise<void>;
}

export function useFeed(): UseFeedReturn {
    const [state, setState] = useState<UseFeedState> ({
        items: [],
        isLoading: true,
        isFetchingMore: false,
        error: null,
        hasMore: true,
    });

    const pageRef = useRef(0);
    const isFetchingRef = useRef(false);
    const hasMoreRef = useRef(true);

    const loadPage = useCallback(async (page: number, isRefresh: boolean) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        
        setState((prev) => ({
            ...prev,
            isLoading: isRefresh,
            isFetchingMore: !isRefresh,
            error: null,
        }));

        const result = await getFeed(page);

        isFetchingRef.current = false;
        hasMoreRef.current = result.hasMore;

        if (result.error) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                isFetchingMore: false, 
                error: result.error
            }));
            return;
        }

        setState ((prev) => ({
            items: isRefresh ? result.data : [...prev.items, ...result.data],
            isLoading: false,
            isFetchingMore: false,
            error: null,
            hasMore: result.hasMore,
        }));
    }, []);

    const refresh = useCallback(async () => {
        pageRef.current = 0;
        hasMoreRef.current = true;
        await loadPage(0, true);
    }, [loadPage]);

    const fetchMore = useCallback(async () => {
        if (!hasMoreRef.current || isFetchingRef.current) return;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        await loadPage(nextPage, false);
    }, [loadPage]);

    return { ...state, refresh, fetchMore };
}