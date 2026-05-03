import React, { createContext, useContext, useState, useEffect } from 'react';

const CommentsContext = createContext();

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};

export const CommentsProvider = ({ children }) => {
  const [comments, setComments] = useState([]);

  // Load comments from localStorage on mount
  useEffect(() => {
    const savedComments = localStorage.getItem('productComments');
    if (savedComments) {
      try {
        const parsedComments = JSON.parse(savedComments);
        // Fix any comments with invalid ratings
        const fixedComments = parsedComments.map(comment => {
          const rating = Number(comment.rating);
          if (!isNaN(rating) && rating >= 1 && rating <= 5) {
            // Rating is valid, but ensure it's a whole number
            return {
              ...comment,
              rating: Math.floor(rating)
            };
          }
          // Keep original if invalid (will be handled by UI)
          return comment;
        });
        setComments(fixedComments);
        // Save fixed comments back to localStorage
        if (JSON.stringify(parsedComments) !== JSON.stringify(fixedComments)) {
          localStorage.setItem('productComments', JSON.stringify(fixedComments));
        }
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
  }, []);

  // Save comments to localStorage whenever comments change
  useEffect(() => {
    localStorage.setItem('productComments', JSON.stringify(comments));
  }, [comments]);

  // Get comments for a specific product (handle both string and number productId)
  const getCommentsByProductId = (productId) => {
    const productIdStr = String(productId);
    return comments.filter(comment => String(comment.productId) === productIdStr);
  };

  // Add a new comment
  const addComment = (comment) => {
    // Ensure rating is a number between 1 and 5
    const rating = Number(comment.rating);
    
    console.log('CommentsContext addComment - Input:', {
      commentRating: comment.rating,
      ratingNumber: rating,
      commentData: comment
    });
    
    // Validate and normalize rating (must be 1-5, whole number)
    // IMPORTANT: Use the exact rating value - don't modify it if it's valid
    let validRating;
    if (isNaN(rating) || rating < 1 || rating > 5) {
      // Invalid rating - default to 1 to prevent errors
      validRating = 1;
      console.warn('CommentsContext - Invalid rating, defaulting to 1:', comment.rating);
    } else {
      // Use the exact rating value (2 = 2, 3 = 3, 5 = 5)
      // Only floor to ensure whole number (2.7 -> 2, 3.2 -> 3)
      validRating = Math.floor(rating);
      console.log('CommentsContext addComment - Valid rating:', validRating);
    }
    
    const newComment = {
      id: Date.now().toString(),
      productId: String(comment.productId), // Ensure productId is always string
      userName: comment.userName,
      rating: validRating, // Save the validated rating value
      text: comment.text,
      image: comment.image || null,
      isTest: comment.isTest !== undefined ? comment.isTest : true,
      createdAt: new Date().toISOString(),
    };
    
    console.log('CommentsContext addComment - Saving comment:', {
      id: newComment.id,
      rating: newComment.rating,
      ratingType: typeof newComment.rating
    });
    
    setComments(prev => {
      const updated = [...prev, newComment];
      console.log('CommentsContext addComment - Updated comments:', updated.map(c => ({
        id: c.id,
        rating: c.rating
      })));
      return updated;
    });
    return newComment;
  };

  // Delete a comment (for future use)
  const deleteComment = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const value = {
    comments,
    getCommentsByProductId,
    addComment,
    deleteComment,
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};
