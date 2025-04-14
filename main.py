import os

def read_and_save_code_files(start_dir, extensions, output_filename):
    """
    Recursively finds files with specified extensions in a directory,
    and saves their relative path and content to a specified output file.

    Args:
        start_dir (str): The directory to start searching from.
                         Usually os.getcwd().
        extensions (tuple): A tuple of file extensions (strings) or specific
                           filenames to look for (e.g., ('.tsx', '.ts', 'package.json')).
                           Case-insensitive matching is used.
        output_filename (str): The name of the file to save the output to.
                               It will be created in the start_dir.
    """
    found_files_count = 0
    start_dir_abs = os.path.abspath(start_dir) # Ensure we have an absolute path
    output_filepath = os.path.join(start_dir_abs, output_filename) # Full path for output file

    # Pre-compile lower-case versions for case-insensitive matching
    lower_extensions = tuple(ext.lower() for ext in extensions if ext.startswith('.'))
    specific_files_lower = tuple(f.lower() for f in extensions if not f.startswith('.'))

    try:
        # Open the output file in write mode ('w') with UTF-8 encoding
        with open(output_filepath, 'w', encoding='utf-8') as outfile:
            outfile.write(f"--- Starting scan in directory: {start_dir_abs} ---\n")
            outfile.write(f"--- Looking for file types/names: {', '.join(extensions)} ---\n\n")

            for dirpath, dirnames, filenames in os.walk(start_dir_abs):
                # --- Optional: Exclude common directories ---
                dirnames[:] = [d for d in dirnames if d not in [
                    'node_modules',
                    '.git',
                    '.next',
                    '.vscode',
                    '__pycache__',
                    '.venv', 'venv',
                    'dist', # Common build output directory
                    'build', # Common build output directory
                    # Add other directories to exclude if needed
                    ]
                ]
                # --- End Optional Exclude ---

                # Skip the directory containing the output file itself if it's within the scan area
                # (unlikely if run from root, but good practice)
                if os.path.commonpath([dirpath, output_filepath]) == dirpath and output_filename in filenames:
                    filenames.remove(output_filename)

                for filename in filenames:
                    match_found = False
                    filename_lower = filename.lower()

                    # Check against extensions
                    for ext in lower_extensions:
                        if filename_lower.endswith(ext):
                            match_found = True
                            break

                    # Check against specific filenames if no extension match yet
                    if not match_found:
                        for specific_file in specific_files_lower:
                            if filename_lower == specific_file:
                                match_found = True
                                break

                    if match_found:
                        found_files_count += 1
                        full_path = os.path.join(dirpath, filename)
                        # Calculate relative path from the original start_dir
                        relative_path = os.path.relpath(full_path, start_dir_abs)
                        # Normalize path separators to forward slashes
                        relative_path_normalized = relative_path.replace(os.sep, '/')

                        # Write the header (path and underline) to the output file
                        outfile.write(f"/{relative_path_normalized}\n")
                        outfile.write("-" * (len(relative_path_normalized) + 1) + "\n")

                        try:
                            # Open and read the code file with utf-8 encoding
                            with open(full_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                            outfile.write(content) # Write content to the output file
                        except (IOError, OSError) as e:
                            outfile.write(f"\n\n[!] Error reading file: {e}\n\n")
                        except UnicodeDecodeError:
                            # Try reading with a different encoding or report error
                            try:
                                with open(full_path, 'r', encoding='latin-1') as infile:
                                    content = infile.read()
                                outfile.write(content)
                                outfile.write("\n\n[!] Warning: File was not UTF-8, read as Latin-1.\n\n")
                            except Exception as e_inner:
                                outfile.write(f"\n\n[!] Error reading file: Could not decode content ({e_inner})\n\n")

                        # Write a separator between files to the output file
                        outfile.write("\n\n" + "="*80 + "\n\n")

            # Write summary message to the output file
            if found_files_count == 0:
                outfile.write(f"--- No files found matching the specified criteria in {start_dir_abs} or its subdirectories (excluding ignored folders). ---\n")
            else:
                outfile.write(f"--- Scan complete. Found and saved {found_files_count} files to {output_filename}. ---\n")

        # Print confirmation to the console after the file is closed
        print(f"Successfully scanned directory and saved output to: {output_filepath}")

    except IOError as e:
        print(f"[!] Error opening or writing to the output file '{output_filepath}': {e}")
    except Exception as e:
        print(f"[!] An unexpected error occurred: {e}")


if __name__ == "__main__":
    # --- Configuration ---
    TARGET_FILES_AND_EXTENSIONS = (
        '.tsx', '.ts',

    )

    OUTPUT_FILENAME = "output.txt" # The name of the file to save results

    # Get the current working directory (where the script is run from)
    current_directory = os.getcwd()

    # --- Run the function ---
    read_and_save_code_files(current_directory, TARGET_FILES_AND_EXTENSIONS, OUTPUT_FILENAME)