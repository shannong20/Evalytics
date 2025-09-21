const questionService = require('../services/questionService');
const { validationResult } = require('express-validator');

/**
 * Controller to create a new question
 * @route POST /api/v1/questions
 */
const createQuestion = async (req, res) => {
  console.log('[QUESTIONS CONTROLLER] createQuestion called');
  
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  try {
    const { text, category_id, is_required = false } = req.body;
    
    console.log('[QUESTIONS CONTROLLER] Creating question with data:', { 
      text, 
      category_id, 
      is_required 
    });
    
    const question = await questionService.createQuestion({
      text,
      category_id,
      is_required
    });
    
    console.log('[QUESTIONS CONTROLLER] Question created successfully:', question.question_id);
    
    return res.status(201).json({
      status: 'success',
      data: {
        question_id: question.question_id,
        text: question.text,
        category_id: question.category_id,
        is_required: question.is_required
      },
    });
  } catch (error) {
    console.error('Error in createQuestion controller:', error);
    
    // Handle specific error cases
    if (error.message.includes('violates foreign key constraint')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category_id. The specified category does not exist.',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Controller to get all categories with their nested questions.
 * @route GET /api/v1/questions/questions-with-categories
 */
const getCategoriesWithQuestions = async (req, res) => {
  console.log('[QUESTIONS CONTROLLER] getCategoriesWithQuestions called');
  try {
    console.log('[QUESTIONS CONTROLLER] Fetching categories from service...');
    const categories = await questionService.getCategoriesWithQuestions();
    console.log('[QUESTIONS CONTROLLER] Categories fetched:', categories ? `Found ${categories.length} categories` : 'No categories found');

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No categories or questions found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { categories },
    });
  } catch (error) {
    console.error('Error in getCategoriesWithQuestions controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getCategoriesWithQuestions,
  createQuestion,
};
