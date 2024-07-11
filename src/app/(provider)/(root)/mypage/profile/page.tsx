'use client';

import Page from '@/components/MyPage/Page';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/contexts/supabase.context';
import Image from 'next/image';
import { useUserStore } from '@/zustand/userStore';
import { LoadingCenter } from '@/components/common/Loading';
import { Notification } from '@/components/common/Alert';
import ImageUploadModal from '@/components/common/Modal/ImageUploadModal';

function ProfilePage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState('');
  const { id, nickname, address, profile_url, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [localNickname, setLocalNickname] = useState(nickname || '');
  const [localAddress, setLocalAddress] = useState(address || '');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        try {
          const {
            data: { session },
            error
          } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching session:', error);
            return;
          }
          if (!session) {
            console.error('No session found:', error);
            return;
          }
          const user = session.user;
          const { data, error: userError } = await supabase
            .from('users')
            .select('id, email, nickname, address, profile_url')
            .eq('id', user.id)
            .single();
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          if (data) {
            setUser(data.id, data.email, data.nickname, data.profile_url, data.address);
            setLocalNickname(data.nickname);
            setLocalAddress(data.address);
            setSelectedImage(data.profile_url);
          }
        } catch (fetchError) {
          console.error('Unexpected error fetching user data:', fetchError);
        } finally {
          setIsLoading(false);
        }
      } else {
        setLocalNickname(nickname || '');
        setLocalAddress(address || '');
        setSelectedImage(profile_url);
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [id, nickname, address, profile_url, setUser]);

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const handleImageUpload = async (file: File) => {
    setSelectedFile(file);

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `profiles/${id}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      console.error('업로드에러 :', uploadError);
      setNotification('업로드 중 에러가 발생했습니다.');
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error('public URL 반환에러');
      return;
    }

    const publicURL = data.publicUrl;
    console.log('Public URL:', publicURL);

    const { error: updateError } = await supabase.from('users').update({ profile_url: publicURL }).eq('id', id);
    if (updateError) {
      console.error('프로필 URL을 업데이트하는 중 오류:', updateError);
      return;
    }

    // Zustand 스토어 업데이트
    if (id) {
      setUser(id, useUserStore.getState().email!, localNickname, publicURL, localAddress);
    }
    setNotification('프로필 이미지가 변경되었습니다.');
    setSelectedImage(publicURL);
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (id) {
      const { error } = await supabase
        .from('users')
        .update({ nickname: localNickname, address: localAddress })
        .eq('id', id);
      if (error) {
        console.error('사용자 데이터를 업데이트하는 중 오류:', error);
      } else {
        // Zustand 스토어 업데이트
        setUser(id, useUserStore.getState().email!, localNickname, profile_url!, localAddress);
        setNotification('프로필 정보가 변경되었습니다.');
      }
    }
  };

  const closeNotification = () => {
    setNotification('');
  };

  if (isLoading) {
    return <LoadingCenter />;
  }

  return (
    <Page title="프로필 수정">
      <div className="flex mt-1 items-start justify-center">
        <div className="w-96 bg-white p-6">
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="relative w-48 h-48 border-solid border-2">
                {selectedImage ? (
                  <Image
                    src={selectedImage as string}
                    alt="Profile"
                    className="object-cover w-full h-full"
                    width={160}
                    height={160}
                    priority
                  />
                ) : (
                  <Image
                    src="/assets/img/profile-Image.png"
                    alt="Profile"
                    className="object-cover w-full h-full"
                    width={160}
                    height={160}
                    priority
                  />
                )}{' '}
              </div>
            </div>
            <button
              onClick={openModal}
              className="text-sm mt-1 text-gray-600 border-solid border-2 rounded-md hover:bg-hover w-48 h-9"
            >
              프로필사진 변경
            </button>
          </div>
          <div className="mt-6">
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={localNickname}
                onChange={(e) => setLocalNickname(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-main rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                주&nbsp;&nbsp;&nbsp;소
              </label>
              <input
                type="text"
                id="address"
                value={localAddress}
                onChange={(e) => setLocalAddress(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-main rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-500"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 px-4 bg-main text-white font-semibold rounded-md shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpload={handleImageUpload}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        titleText="프로필 이미지 변경"
        uploadLabelText="이미지 가져오기"
      />

      <Notification message={notification} onClose={closeNotification} />
    </Page>
  );
}

export default ProfilePage;
