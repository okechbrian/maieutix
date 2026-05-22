insert into public.courses (id, title, description)
values (
  'python-beginner',
  'Python Beginner Track',
  'A school-ready Python curriculum built around specification, dialogue, code, and reflection.'
)
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description;

insert into public.lessons (
  id,
  course_id,
  slug,
  title,
  prompt,
  expected_concepts,
  starter_code
)
values
  ('lesson-variables', 'python-beginner', 'variables', 'Variables and Values', 'Build a short learner profile that stores a name, age, school, and one learning goal, then prints a friendly summary.', array['variables', 'strings', 'numbers', 'print'], 'name = "Amina"
age = 13
school = "Demo School"
goal = "learn Python"

# Print a profile summary below
'),
  ('lesson-strings', 'python-beginner', 'strings', 'Strings and Messages', 'Create a welcome card for a new coding club member using their name, school, and favorite subject.', array['strings', 'f-string', 'concatenation', 'print'], 'name = "Amina"
school = "Demo School"
subject = "science"

# Build and print a welcome message
'),
  ('lesson-numbers', 'python-beginner', 'numbers', 'Numbers and Calculations', 'Calculate the total cost of exercise books, pens, and transport for a school day, then print the final total.', array['integers', 'addition', 'multiplication', 'variables'], 'book_price = 2500
books = 3
pen_price = 500
pens = 2
transport = 2000

# Calculate the total cost
'),
  ('lesson-input-output', 'python-beginner', 'input-output', 'Input and Output', 'Build a simple greeting program that asks for a name and favorite subject, then prints a personal message.', array['input', 'strings', 'f-string', 'print'], 'name = input("What is your name? ")
subject = input("Favorite subject? ")

# Print a personal message
'),
  ('lesson-booleans', 'python-beginner', 'booleans-comparisons', 'Booleans and Comparisons', 'Check whether a learner has reached a practice goal by comparing minutes practiced with a target.', array['booleans', 'comparison', 'greater than', 'print'], 'minutes_practiced = 35
target_minutes = 30

# Compare practice time with the target
'),
  ('lesson-conditionals', 'python-beginner', 'conditionals', 'Conditionals', 'Write a small study helper that recommends what a learner should do based on their quiz score.', array['if', 'elif', 'else', 'comparison'], 'score = 72

# Recommend next steps for the learner
'),
  ('lesson-nested-conditionals', 'python-beginner', 'nested-conditionals', 'Nested Decisions', 'Recommend a learning activity based on a student''s quiz score and whether they have internet access today.', array['nested if', 'and', 'else', 'decision tree'], 'score = 64
has_internet = True

# Recommend an activity
'),
  ('lesson-lists', 'python-beginner', 'lists', 'Lists', 'Track a learner''s three recent quiz scores, calculate the total, and print a short progress message.', array['list', 'sum', 'len', 'loop or indexing'], 'scores = [68, 74, 81]

# Calculate total and average
'),
  ('lesson-indexing', 'python-beginner', 'indexing', 'Indexing and Slicing', 'Use a list of school subjects to print the first subject, last subject, and a short list of revision priorities.', array['index', 'slice', 'list', 'negative index'], 'subjects = ["math", "english", "science", "history", "python"]

# Print selected subjects
'),
  ('lesson-list-methods', 'python-beginner', 'list-methods', 'List Methods', 'Maintain a classroom supply list by adding a missing item, removing a duplicate, and printing the sorted list.', array['append', 'remove', 'sort', 'list methods'], 'supplies = ["chalk", "books", "pens", "books"]

# Update and print the supply list
'),
  ('lesson-loops', 'python-beginner', 'loops', 'Loops', 'Create a weekly practice planner that prints a small Python practice task for each school day.', array['for loop', 'list', 'print'], 'days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

# Print a practice plan for each day
'),
  ('lesson-loop-accumulators', 'python-beginner', 'loop-accumulators', 'Loop Accumulators', 'Add up weekly study minutes from a list and print the total plus the average per day.', array['for loop', 'accumulator', 'total', 'average'], 'minutes = [20, 30, 25, 40, 35]
total = 0

# Add each day''s minutes to total
'),
  ('lesson-while-loops', 'python-beginner', 'while-loops', 'While Loops', 'Simulate a savings goal where a learner adds the same amount each week until they can buy a calculator.', array['while loop', 'condition', 'counter', 'accumulator'], 'goal = 15000
saved = 0
weekly_saving = 3000
weeks = 0

# Keep saving until the goal is reached
'),
  ('lesson-functions', 'python-beginner', 'functions', 'Functions', 'Write a function that creates a revision message for any subject and number of minutes.', array['def', 'parameters', 'return', 'function call'], 'def revision_message(subject, minutes):
    # Return a helpful message
    return ""

print(revision_message("math", 20))
'),
  ('lesson-function-return-values', 'python-beginner', 'function-return-values', 'Return Values', 'Write a function that calculates the average of three quiz scores and returns the result for a progress message.', array['return', 'function call', 'average', 'variable assignment'], 'def average_score(score1, score2, score3):
    # Calculate and return the average
    return 0

average = average_score(70, 82, 76)
# Print a progress message
'),
  ('lesson-dictionaries', 'python-beginner', 'dictionaries', 'Dictionaries', 'Create a learner profile dictionary with name, school, class level, and learning goal, then print a clear summary.', array['dictionary', 'keys', 'values', 'lookup'], 'learner = {
    "name": "Amina",
    "school": "Demo School",
    "level": "S1",
    "goal": "learn Python"
}

# Print a profile summary
'),
  ('lesson-dictionary-updates', 'python-beginner', 'dictionary-updates', 'Updating Dictionaries', 'Update a small inventory dictionary after a classroom receives new pens and uses some books.', array['dictionary update', 'assignment', 'keys', 'arithmetic'], 'inventory = {
    "pens": 12,
    "books": 8,
    "chalk": 4
}

# Update the inventory and print the result
'),
  ('lesson-debugging', 'python-beginner', 'debugging', 'Debugging', 'Fix a broken points calculator and explain which bug you found first.', array['syntax errors', 'logic errors', 'print debugging'], 'points = [10, 8, 7]
bonus = 5

# This should print the total points with bonus.
total = sum(points) + bonus
print("Total:", total)
'),
  ('lesson-error-handling', 'python-beginner', 'error-handling', 'Handling Bad Input', 'Write a score checker that handles a score below 0 or above 100 with a helpful message.', array['validation', 'if', 'elif', 'boundary'], 'score = 105

# Check whether the score is valid before giving feedback
'),
  ('lesson-testing', 'python-beginner', 'testing', 'Manual Testing', 'Create a small set of test cases for a grade feedback program and print what each case should check.', array['test cases', 'boundary values', 'expected output', 'conditionals'], 'test_scores = [0, 49, 50, 79, 80, 100]

# Print what each score should test
'),
  ('lesson-modules-random', 'python-beginner', 'modules-random', 'Modules and Random Choices', 'Create a study prompt generator that randomly chooses a subject and a short practice task.', array['import', 'random', 'choice', 'list'], 'import random

subjects = ["math", "science", "english", "python"]
tasks = ["review notes", "answer 5 questions", "teach a friend"]

# Choose and print a random study prompt
'),
  ('lesson-files-concept', 'python-beginner', 'files-concept', 'File Thinking', 'Design a reading log as a list of lines, then print it as if it were saved in a text file.', array['strings', 'lists', 'join', 'file concept'], 'reading_log = [
    "Monday: 10 pages",
    "Tuesday: 12 pages",
    "Wednesday: 8 pages"
]

# Format the log for saving or display
'),
  ('project-study-timer', 'python-beginner', 'study-timer', 'Project: Study Timer', 'Create a study timer planner that takes subjects and minutes, then prints a balanced revision schedule.', array['lists', 'loops', 'conditionals', 'functions'], 'subjects = ["math", "science", "python"]
minutes_each = 20

# Build a schedule
'),
  ('project-market-calculator', 'python-beginner', 'market-calculator', 'Project: Market Calculator', 'Build a small calculator for a market basket with item names, prices, and a total cost.', array['lists', 'numbers', 'loops', 'formatting'], 'items = ["beans", "rice", "soap"]
prices = [3500, 4200, 2500]

# Print each item and the total
'),
  ('project-quiz-game', 'python-beginner', 'quiz-game', 'Project: Quiz Game', 'Create a three-question quiz that tracks a score and prints encouraging feedback.', array['variables', 'conditionals', 'scorekeeping', 'functions'], 'score = 0

# Ask or simulate three questions, update score, and print feedback
'),
  ('project-attendance-summary', 'python-beginner', 'attendance-summary', 'Project: Attendance Summary', 'Create a program that counts present and absent learners from a list and prints an attendance summary.', array['lists', 'loops', 'counters', 'conditionals'], 'attendance = ["present", "absent", "present", "present", "absent"]

# Count present and absent learners
'),
  ('project-library-helper', 'python-beginner', 'library-helper', 'Project: Library Helper', 'Build a helper that stores book titles and availability, then prints which books can be borrowed.', array['dictionaries', 'loops', 'conditionals', 'lists'], 'books = {
    "Python Basics": True,
    "Science Stories": False,
    "Math Practice": True
}

# Print available books
'),
  ('project-health-reminder', 'python-beginner', 'health-reminder', 'Project: Health Reminder', 'Create a daily health reminder that uses weather, water intake, and activity minutes to suggest one action.', array['conditionals', 'booleans', 'functions', 'messages'], 'weather = "hot"
glasses_of_water = 3
activity_minutes = 20

# Print one helpful health reminder
'),
  ('project-budget-planner', 'python-beginner', 'budget-planner', 'Project: Budget Planner', 'Build a weekly budget planner that totals income and expenses, then says whether the learner met a savings goal.', array['lists', 'sum', 'conditionals', 'formatting'], 'income = [5000, 3000]
expenses = [2500, 1000, 1500]
savings_goal = 2500

# Calculate remaining money and compare with the goal
'),
  ('project-final-learning-coach', 'python-beginner', 'final-learning-coach', 'Capstone: Learning Coach', 'Create a study coach that stores subjects and scores, recommends what to revise first, and prints a weekly practice plan.', array['lists', 'dictionaries', 'loops', 'functions', 'conditionals'], 'subjects = [
    {"name": "math", "score": 62},
    {"name": "science", "score": 78},
    {"name": "python", "score": 70}
]

# Recommend a revision plan
')
on conflict (id) do update
  set course_id = excluded.course_id,
      slug = excluded.slug,
      title = excluded.title,
      prompt = excluded.prompt,
      expected_concepts = excluded.expected_concepts,
      starter_code = excluded.starter_code;
