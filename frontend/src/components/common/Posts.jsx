import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const Posts = ({ feedType, username, userId }) => {
	const getPostEndpoint = () => {
		switch (feedType) {
			case "forYou":
				return "/api/posts/all";
			case "following":
				return "/api/posts/following";
			case "posts":
				return `/api/posts/user/${username}`;
			case "likes":
				return `/api/posts/likes/${userId}`;
			default:
				return "/api/posts/all";
		}
	};

	const POST_ENDPOINT = getPostEndpoint();

	const {
		data: posts,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			try {
				const res = await fetch(POST_ENDPOINT);
				const data = await res.json();
				console.log("Original posts:", data); // Debug log

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}

				// Censor all posts
                const censorRes = await fetch('http://localhost:5000/censor-posts', {
                    method: 'POST',
                    headers: { 
						'Content-Type': 'application/json'
					},
                    body: JSON.stringify({ 
                        posts: data.map(post => ({
                            id: post._id,
                            text: post.text
                        }))
                    })
                });
                const censorData = await censorRes.json();
				console.log("Censored response:", censorData);

				// Update posts with censored text
				const updatedPosts = data.map(post => {
					const censoredPost = censorData.censored_posts.find(p => p.id === post._id);
					return {
						...post,
						text: censoredPost ? censoredPost.censored_text : post.text
					};
				});
				console.log("Updated posts:", updatedPosts); // Debug log
				
				return updatedPosts;
			} catch (error) {
				console.error("Error in posts query:", error); // Debug log
				throw new Error(error);
			}
		},
	});

	useEffect(() => {
		refetch();
	}, [feedType, refetch, username]);

	return (
		<>
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && !isRefetching && posts?.length === 0 && (
				<p className='text-center my-4'>No posts in this tab. Switch 👻</p>
			)}
			{!isLoading && !isRefetching && posts && (
				<div>
					{posts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}
		</>
	);
};
export default Posts;
