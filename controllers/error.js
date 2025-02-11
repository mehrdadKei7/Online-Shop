exports.getError = (req, res,next) => {
    res.status(500).render('error', {
        pageTitle: 'Error',
        path: '/error',
        isAuthenticated: req.session.userId,
        errorMessage: 'An error occurred on the server. Please try again later.'
    })
}