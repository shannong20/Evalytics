const questionService = require('../services/questionService');

/**
 * Controller to get all categories with their nested questions.
 * @route GET /api/v1/questions-with-categories
 */
const getCategoriesWithQuestions = async (req, res) => {
  try {
    const categories = await questionService.getCategoriesWithQuestions();

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
};
