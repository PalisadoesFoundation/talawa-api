"""Utility functions.

These are the utility functions that are necessary
for both the installation and post_installation scripts
to be executed successfully and display corresponding messages.

"""
import sys
from rich.markdown import Markdown
from rich.console import Console

console = Console()


def display_markdown(text, color="yellow"):

    """Display the text in markdown files

    Reads the content of markdown files and displays them
    on the console as expected to be seen in a markdown.The
    output text colour is by default set to "yellow".

    Args:
        text: String
            Markdown content to be displayed on the console.
        color [optional]: String
            Colour of the text to be displayed.

    Returns:
        None

    """
    markdown = Markdown(text, style=color)
    console.print(markdown)


def display_success(text, color="yellow"):
    """Display a success message

    Displays a success message on the console,
    with a given color,and yellow by deafult.

    Args:
        text: String
            Message to be displayed on the console.
        color [optional]: String
            Color of the text to be displayed on the console.

    Returns:
        None

    It was necessary to create this function, since it gives
    us the liberty to configure the global style of any success
    message of the application.
    """
    console.print(text, style=color)


def exit_process(reason=""):
    """Exit the process

    This runs whenever an error is encountered. It displays the
    reason of error and exits the installation process.

    Args:
        reason: String
            Reason or message produced by the error.

    Returns:
        None

    """
    console.print("ERROR:Exiting current process :cross_mark:", style="red")
    console.print("REASON:", reason, style="yellow")
    sys.exit()
