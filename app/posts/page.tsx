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
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Hero Section */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg"
      >
        <h1 className="text-3xl font-bold">Skill Requests</h1>

        <p className="mt-2 text-purple-100">
          Discover teammates and collaborate on upcoming events.
        </p>

        <button
          onClick={() => setModalOpen(true)}
          className="mt-4 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium"
        >
          + Create Skill Request
        </button>
      </motion.div>

      {/* Posts Feed */}

      {loading ? (
        <p className="text-neutral-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <p className="text-neutral-600">No skill requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              whileHover={{ y: -4 }}
              className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm transition"
            >
              {/* Title */}

              <h2 className="text-lg font-semibold">{post.title}</h2>

              {/* Event */}

              {post.event && (
                <p className="text-sm text-neutral-500 mt-1">
                  Event: {post.event.title}
                </p>
              )}

              {/* Description */}

              <p className="text-neutral-700 mt-3">{post.description}</p>

              {/* Skills */}

              <div className="flex flex-wrap gap-2 mt-4">
                {post.requiredSkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>

              {/* Footer */}

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-neutral-500">
                  Posted by {post.creator.name} • {post.creator.department} •
                  Year {post.creator.year}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {post.interestCount} interested
                  </span>

                  {/* INTEREST BUTTON */}

                  <button
                    onClick={() => handleInterest(post.id)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                  >
                    I'm Interested
                  </button>
                  {post.creator.id === session?.user?.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(post.id)}
                        className="px-3 py-2 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-100 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {/* PROFILE */}

                  <button
                    onClick={() => {
                      setSelectedUser(post.creator);
                      setProfileOpen(true);
                    }}
                    className="px-4 py-2 text-sm border rounded-lg"
                  >
                    View Profile
                  </button>

                  {/* CANDIDATES */}

                  <button
                    onClick={() => {
                      setSelectedPostId(post.id);
                      setInterestModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm border rounded-lg"
                  >
                    View Candidates
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODALS */}

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
