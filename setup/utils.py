"""Modules"""
import sys
from rich.markdown import Markdown
from rich.console import Console

console = Console()


def display_markdown(text, color='yellow'):
    """Read from markdown file and display the text"""
    markdown = Markdown(text, style=color)
    console.print(markdown)


def display_success(text, color='yellow'):
    """Display a text with yellow colour by default"""
    console.print(text, style=color)


def exit_process(reason=""):
    """Exit the process and show the error message"""
    console.print("ERROR:Exiting current process :cross_mark:", style="red")
    console.print("REASON:", reason, style="yellow")
    sys.exit()
