import json
import random


def load_questions(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}


def display_welcome():
    print("Virtual Maths Question Bank                     |")
    print("------------------------------------------------\n")


def display_ui(level, question_data):
    print("Virtual Maths Question Bank                    |")
    print("------------------------------------------------")
    print(f"\nDifficulty: {level} (1-5)\n")
    print("------------------------------------------------")
    print("|                                              |")
    print("| Question:                                    |")

    q_text = question_data["question"]
    print(f"| {q_text:<44} |")

    print("|                                              |")
    print("------------------------------------------------\n")

    options = question_data["options"]
    for key in ["A", "B", "C", "D"]:
        print(f"( ) {key}) {options[key]}")



def main():
    questions_db = load_questions("questions_demo.json")

    if not questions_db:
        return

    available_questions = {}
    for level, q_list in questions_db.items():
        available_questions[level] = list(q_list)
        random.shuffle(available_questions[level])

    completed_levels = set()

    display_welcome()

    while True:
        current_level = input("Select a starting difficulty level (1-5): ").strip()
        if current_level in available_questions:
            break
        print("Invalid level or no questions available for that level. Try again.")

    while True:
        if not available_questions[current_level]:
            completed_levels.add(current_level)
            print(f"\n*** You have finished all questions in Level {current_level}! ***")

            if len(completed_levels) == len(available_questions):
                print("\nCongratulations! You have completed all available levels!")
                break

            while True:
                new_level = input(
                    "\nPlease select a DIFFERENT level (1-5) to continue: "
                ).strip()

                if new_level not in available_questions:
                    print("That level doesn't exist.")
                elif new_level in completed_levels:
                    print(f"You already completed level {new_level}.")
                else:
                    current_level = new_level
                    break
            continue

        current_q = available_questions[current_level].pop(0)

        display_ui(current_level, current_q)

        while True:
            user_ans = input("Your choice (A/B/C/D): ").strip().upper()
            if user_ans in ["A", "B", "C", "D"]:
                break
            print("Please enter A, B, C, or D.")

        print("\n------------------------------------------------")

        if user_ans == current_q["answer"]:
            print("Correct! Here is another question.\n")
            print("[ Next Question ]")
        else:
            print("Incorrect. Try another question at the same level.\n")
            print("[ Next Question ]")

        print("------------------------------------------------")
        input("Press Enter to continue...")


if __name__ == "__main__":
    main()