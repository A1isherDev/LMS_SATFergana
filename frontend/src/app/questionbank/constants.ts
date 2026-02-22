export const TOPIC_HIERARCHY = {
    ENGLISH: {
        label: 'English',
        total_questions: 2130, // Mock data, replace with real if available
        color: 'bg-purple-500',
        text_color: 'text-purple-500',
        bg_soft: 'bg-purple-50',
        dark_bg_soft: 'dark:bg-purple-900/20',
        categories: [
            {
                name: 'Craft and Structure',
                count: 570,
                skills: [
                    'Cross-Text Connections',
                    'Text Structure and Purpose',
                    'Words in Context'
                ]
            },
            {
                name: 'Expression of Ideas',
                count: 453,
                skills: [
                    'Rhetorical Synthesis',
                    'Transitions'
                ]
            },
            {
                name: 'Information and Ideas',
                count: 609,
                skills: [
                    'Central Ideas and Details',
                    'Command of Evidence',
                    'Inferences'
                ]
            },
            {
                name: 'Standard English Conventions',
                count: 498,
                skills: [
                    'Boundaries',
                    'Form, Structure, and Sense'
                ]
            }
        ]
    },
    MATH: {
        label: 'Math',
        total_questions: 2161, // Mock data
        color: 'bg-cyan-500',
        text_color: 'text-cyan-500',
        bg_soft: 'bg-cyan-50',
        dark_bg_soft: 'dark:bg-cyan-900/20',
        categories: [
            {
                name: 'Algebra',
                count: 744,
                skills: [
                    'Linear equations in one variable',
                    'Linear functions',
                    'Linear equations in two variables',
                    'Systems of two linear equations in two variables',
                    'Linear inequalities in one or two variables'
                ]
            },
            {
                name: 'Advanced Math',
                count: 610,
                skills: [
                    'Equivalent expressions',
                    'Nonlinear equations in one variable and systems of equations in two variables',
                    'Nonlinear functions'
                ]
            },
            {
                name: 'Problem-Solving and Data Analysis',
                count: 462,
                skills: [
                    'Ratios, rates, proportional relationships, and units',
                    'Percentages',
                    'One-variable data: Distributions and measures of center and spread',
                    'Two-variable data: Models and scatterplots',
                    'Probability and conditional probability',
                    'Inference from sample statistics and margin of error',
                    'Evaluating statistical claims: Observational studies and experiments'
                ]
            },
            {
                name: 'Geometry and Trigonometry',
                count: 345,
                skills: [
                    'Area and volume',
                    'Lines, angles, and triangles',
                    'Right triangles and trigonometry',
                    'Circles'
                ]
            }
        ]
    }
};
