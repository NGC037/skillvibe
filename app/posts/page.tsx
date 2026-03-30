"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CreatePostModal from "@/components/posts/CreatePostModal";
import ProfileModal from "@/components/profile/ProfileModal";
import InterestedUsersModal from "@/components/posts/InterestedUsersModal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Skill = {
  id: string;
  name: string;
};

type Creator = {
  id: string;
  name: string;
  department: string;
  division?: string;
  year: number;
  linkedinUrl?: string;
  skills?: Skill[];
};

type Post = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  interestCount: number;
  event?: {
    title: string;
  };
  creator: Creator;
  requiredSkills: Skill[];
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Creator | null>(null);

  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts/list")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      });
  }, []);

  const handleInterest = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/interest`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      console.log(data);
      router.refresh();
    } catch (error) {
      console.error("Interest error:", error);
    }
  };

  const handleEdit = async (postId: string) => {
    const title = prompt("Enter new title");
    const description = prompt("Enter new description");

    if (!title || !description) return;

    await fetch(`/api/posts/${postId}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
      }),
    });

    router.refresh();
  };

  const handleDelete = async (postId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this post?");

    if (!confirmDelete) return;

    await fetch(`/api/posts/${postId}/delete`, {
      method: "DELETE",
    });

    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card-strong overflow-hidden p-8 text-white"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-purple-200">
              Collaboration board
            </p>
            <h1 className="mt-3 text-3xl font-bold">Skill Requests</h1>
            <p className="mt-2 max-w-2xl text-purple-100">
              Discover teammates and collaborate on upcoming events.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="rounded-2xl bg-white px-5 py-3 font-medium text-purple-700 shadow-lg transition hover:scale-[1.02]"
          >
            + Create Skill Request
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-card p-6 space-y-4">
              <div className="shimmer-skeleton h-6 w-48 rounded-full" />
              <div className="shimmer-skeleton h-4 w-32 rounded-full" />
              <div className="shimmer-skeleton h-16 w-full rounded-2xl" />
              <div className="flex gap-2">
                <div className="shimmer-skeleton h-8 w-20 rounded-full" />
                <div className="shimmer-skeleton h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-neutral-600">No skill requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              whileHover={{ y: -4 }}
              className="surface-card interactive-card p-6 transition"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-neutral-900">{post.title}</h2>

                    {post.event ? (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        Event: {post.event.title}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 leading-7 text-neutral-700">{post.description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.requiredSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
                    Posted by {post.creator.name} - {post.creator.department} - Year {post.creator.year}
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-4 rounded-[1.5rem] border border-neutral-100 bg-gradient-to-br from-neutral-50 to-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Interest</span>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                      {post.interestCount} interested
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleInterest(post.id)}
                      className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:shadow-md"
                    >
                      I&apos;m Interested
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(post.creator);
                        setProfileOpen(true);
                      }}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      View Profile
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPostId(post.id);
                      setInterestModalOpen(true);
                    }}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
                  >
                    View Candidates
                  </button>

                  {post.creator.id === session?.user?.id ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleEdit(post.id)}
                        className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CreatePostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPostCreated={() => router.refresh()}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={selectedUser}
      />

      <InterestedUsersModal
        postId={selectedPostId}
        open={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
      />
    </div>
  );
}
