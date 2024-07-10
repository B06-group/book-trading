'use client';

import ProductList from '@/components/list/ProductList';
import React, { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getGroundProductList } from '@/api/listApi';
import useSearchStore, { searchStoreType } from '@/zustand/searchStore';
import useUserStore from '@/zustand/userStore';
import ProductListHeader from '@/components/list/ProductListHeader';

function ListOfAroundPage() {

  const { user } = useUserStore();
  const [address, setAddress] = useState<string | undefined>('');
  const { search: { keyword }, setKeyword } = useSearchStore<searchStoreType>((state) => state);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending
  } = useInfiniteQuery({
    initialData: undefined, initialPageParam: undefined,
    queryKey: ['productList', {
      keyword: `%${keyword}%`,
      requestAddress: `%${address}%`,
      requestLimit: 12
    }],
    queryFn: getGroundProductList,
    getNextPageParam: (lastPage, allPages) => lastPage.nextPage
  });

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    setAddress(user?.address);
  }, [user?.address]);

  useEffect(() => {
    return () => {
      setKeyword('');
    };
  }, []);

  return (
    <div className={'flex gap-10 pt-[100px]'}>
      <div className={'flex flex-col gap-2'}>
        <ProductListHeader title={'내 근처 도서목록'} keyword={keyword}>
          {
            data?.pages[0].productList.length !== 0 ?
              <ProductList pageList={data?.pages} /> : <div className={"ml-[10px]"}>결과가 없습니다.</div>
          }
        </ProductListHeader>
      </div>
    </div>
  );
}

export default ListOfAroundPage;