#!/usr/bin/env python
import os
import sys


def main():
    # Point Django management commands at this project's settings before dispatching.
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    # Keep importing this module side-effect-free for tools and tests.
    main()
