# **spy**
### A tool for immediate testing and instant feedback on Python code.

## Features

- Automatically attaches to documents in workspaces with the python language active
- Highlights instances of the `#spy` decorator that occur before a function definition
    - Mousing over the highlight provides code coverage testing for that function as provided by Coverage (https://coverage.readthedocs.io).
        - Functions need to type hint their arguments (if any) and functions/methods are currently limited to only ints, floats, strs, and bools.
        - Collates "interesting" data values for plain-old-data function arguments to use as test inputs.
        - You don't need to write any input validation tests yourself!
        - Mouseover will report potential input validation failures so you can instantaneously proof your code.
    - Mousing over the highlight provides linting and static analysis feedback for that function as provided by PyLint (https://docs.pylint.org/).
    - Mousing over the highlight provides code complexity characteristics for that function as determined by Radon (http://radon.readthedocs.org/).
- UI elements will update whenever you stop editing the file. PyLint and Radon will run whenever you open or look at a valid Python file. PyLint, Radon, and coverage and input testing will run whenever you save a valid Python file.
    
### Known Issues

- VSCode in Browser is unsupported due to filesystem requirements.
- Coverage testing marks comment lines as missed...which is correct, but unhelpful.
- Coverage testing breaks down on overloaded/shadowed functions.
- Coverage testing does not support unspecified input types or kwargs.
- Currently no way to provide a workspace-specific configuration for PyLint integration - you get the defaults.

## Requirements

- **Visual Studio Code**
- **Node.js**
- **Python** (3.9 or newer required for full functionality)
- Extension automatically installs the required **Python-Shell** package from **npm**
- (Optional) **Radon** integration
- (Optional) **coverage.py** integration
- (Optional) **PyLint** integration

## Extension Settings

With the extension installed (including in debug sessions built from source), each of these settings can be changed by going to `> File > Preferences > Settings > User > Extensions > PySpy` and changing it in `settings.json`. All of these settings are persisted with your VSCode profile.
* `spy.AnalysisEnabled`: True/False toggle for built-in immediate static analysis and code linting. Needs to be installed separately with `pip install pylint`. While enabled, **spy** will automatically attempt to display messages from the analysis tool about your tagged function when you hover one such highlight.
* `spy.RadonInstallLocation`: Path to the Radon executable. Needs to be installed separately with `pip install radon`. A successful install should list the path; note that Windows expects escaped backslashes.
* `spy.TestingEnabled`: True/False toggle for built-in immediate unit testing. Needs to be installed separately with `pip install coverage`. While enabled, **spy** will automatically attempt to test functions for signature breaks and code coverage, displaying coverage highlights in the traditional red (uncovered) and green (covered) and warning the user about possible errors.
* `spy.TestingUseDangerousStrings`: True/False toggle; does nothing if `spy.TestingEnabled` is False. While enabled, **spy** will include wildcard strings in test inputs. **If your code does something stupid like `os.system("rm -rf " + inputstring)` then those wildcards will be evaluated and executed.** This setting is disabled by default.

## Building and Running From Source

1. Open a new Visual Studio Code workspace in the repository directory.
2. Press `F5` to start a new debug session with PySpy running!
3. (Optional) Check the **Extension Settings** section above for details on how to install and connect **coverage.py** integration.
4. (Optional) Check the **Extension Settings** section above for details on how to install and connect **PyLint** integration.
5. (Optional) Check the **Extension Settings** section above for details on how to install and connect **Radon** integration.

**N.B.** If you are trying to modify or extend PySpy, there's an intermittent issue in VSCode's typescript import resolution where it will get stuck complaining that the imported file could not be found - even if it does exist and imported functions are recognized and can be called. Restarting VSCode should resolve this.

## Implementation Details

As **spy** is a learning experiment for writing VSCode extensions, it's worth documenting how it works.
### 1. Extension Setup
- The extension registers itself with an activation event of "onLanguage:python". Thus when VSCode opens a file and loads the user's language spec for python for the first time in a session, `extension.ts::activate()` is executed.
- `activate()` performs the following things:
    - First time setup (defining some values for later use)
    - Registering UI events (`onDidChangeActiveTextEditor` and `onDidChangeTextDocument`) to run UI updates only when potentially useful
    - Checks for the currently attached version of Python, as several features have version requirements (most stringently is that **coverage.py** requires Python 3.9 or higher).

### 2. Structure
- `package.json`: Extension manifest and description
- `src/extension.ts`: Entrypoint for the extension. Sets up all the event listeners to hook into user actions in VSCode to run **spy** features.
- `src/spy.ts`: Top-level file for **spy** features. This currently includes the 15-second loop which compiles python files found in the workspace as a basic syntax check.
- `src/spyAnalysis.ts`: Manages code analysis report creation and parsing for **PyLint** integration.
- `src/spyCompile.ts`: Helper functions for compiling Python source files and then deleting the compiled files.
- `src/spyCoverage.ts`: Manages code coverage testing features and tools overseeing Coverage integration.
- `src/spyFS.ts`: Filesystem helpers for determining which files and functions in the workspace other features should care about.
- `src/spyMarshal.ts`: Primary TypeScript-to-Python interactions and **Python-Shell** integration that actually runs extension python code.
- `src/spyStatistics.ts`: Manages code complexity features and tools overseeing **Radon** integration.
- `src/spyTesting.ts`: Manages code coverage integration via **Coverage** and test report parsing for hovers.
- `src/spyUI.ts`: Manages the creation and application of VSCode UI elements for the extension using a `vscode.TextEditorDecorationType`.
- `src/spyInputs.py`: Manages the creation of "interesting" inputs for input testing.
- `src/spyCoverage.py`: Wrapper for coverage and input testing of workspace python code.

### 3. UI
- Opt-in: only run on files and functions where the user has opted in by adding a `#spy` comment directly before a function. If you want the features, it's right there.
- Whenever the user opens an editor while the extension is active or completes some typing task, these indicators for open editors are updated. This gives a good balance between responsiveness and performance - no updates are being performed while the user is actively coding in the workspace, but as soon as the user stops the updates will trigger for immediate feedback.
- Featuring:
    - Pink line highlights when `#spy` python comments are found, indicating that **spy** will run on the tagged function.
    - Hovering over pink highlights will result in tooltip popups from the Analysis and Testing tools if enabled.
    - Pink highlights come with three gutter icons to indicate to the user the status of coverage testing: a question mark for tests not yet run; a green play icon for coverage tests that encountered no issues; or a red stop icon for coverage tests that failed for some input subset.
    - Unobtrusive green line highlight to indicate code coverage on `#spy`-tagged functions.
    - Unobtrusive red line highlight to indicate lack of code coverage on `#spy`-tagged functions.
- UI calculations are actually doing a lot of work behind the scenes. A list of all of the `#spy` tags and their locations is maintained and that list is what the rest of the code uses to determine what other tools to run and what or where to attach mouseover tooltips to. This is the `spyDecoList` in `spyUI.ts` and every time a relevant user event triggers `updateDecorations()` this list is rebuilt from open text editors to keep processing time low.

### 4. Analysis
- **PyLint** is perhaps the leading Python source linter and static analysis tool. Although not immensely complicated on it's own, it's still a powerful tool and especially so for Python where formatting and whitespace is syntactically signficant.
- Both **PyLint** and **Radon** integrations are set up by executing those tools from a hidden `Terminal` in the IDE, saving the output to disk, then opening that output and parsing it into decorations to add to the UI when the relevant `HoverProvider` request is made. The exact methods of action are slightly different; `src/spyAnalysis.ts` (for **PyLint**) piggybacks on an in-memory list of test report feedback from the testing tools which are searched and served on mouseover, whereas `src/spyStatistics.ts` (for **Radon**, implemented first) checks for the existence of a Radon cache file and reads it when the mouseover request is made.
- You may desire to hide test output files from your VSCode workspace. Analysis test reports are currently written to the workspace directory; you can edit your user settings to ignore ".pylintjson" files by following the configuration steps here: https://code.visualstudio.com/docs/configure/settings or by nullifying them in the `.vscodeignore` file by adding the line "**.pylintjson".

### 5. Testing
##### The driving feature behind this whole project. Why do we need to waste time writing tests for simple things? Well, if you work for CrowdStrike... https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf
- **spy** means you should not need to write coverage or boundary condition tests! The core feature of this extension is that it will automatically test your code for failure points related to input edge cases. Testing is automatically performed when you open or save a file that includes a function tagged with `#spy`.
- Notably, whereas code analysis is performed whenever the file is looked at or saved, tests only run when the file is saved.
- **spy** uses a different test mechanism than traditional VSCode test tools and extensions because **spy** automatically performs interface and coverage testing. It does **NOT** make any guarantee that your code is correct - it does not check output correctness, only output validity.
    - Testing is the most finicky part of **spy** tools.
        - Under the hood we peek at the compiled bytecode that the source file under test creates to extract a list of all constants found in the function.
        - We also look at the interpreted function objects and extract input types from type hints in the signature.
    - Automatically tests every combination of inputs from a premade list for each `int`, `float`, `str`, or `bool` type in the signature, plus all constants of those types found in the function, plus potentially "interesting" transforms of those constants.
    - "Interesting values" are transforms that are likely to cause issues with a given value - for example, if the source code compares an integer to the number `4`, **spy** will automatically test values `3`, `4`, and `5` (along with many other values). You can examine the full set of values tested in `src/spyInputs.py`.
- **spy** testing runs alongside other VSCode test tools like the default **pytest** and **unittest**. Those tools still work exactly as they are designed to and **spy** does not interfere with them in any way except for potential code coverage highlighting conflicts. You can disable other test extension coverage highlighting by toggling the `Show Inline Coverage` button (default shortcut: `Ctrl+; Ctrl+Shift+I`) if you prefer **spy**'s automatic testing and highlighting, or you can disable **spy**'s testing and highlighting in the extension settings (details below).
- You may desire to hide test output files from your VSCode workspace. Coverage test reports are currently written to the workspace directory; you can edit your user settings to ignore ".py.covjson" files by following the configuration steps here: https://code.visualstudio.com/docs/configure/settings or by nullifying them in the `.vscodeignore` file by adding the line "**.py.covjson".

### 6. Extension to Other Languages
**spy**, or specifically this flavour **PySpy**, is intended solely for use with Python source code, and the tooling within reflects that. However, it has been intentionally structured in such a way as to (hopefully easily) work for other programming languages by confining the required changes. It's out of the scope of this exercise, but future work would be to split language support into subdirectories of `src/` that each register a separate set of handlers for that programming language - expanding to "*C#Spy*" for instance.

- string constants throughout the extension code would need to be updated for non-python use cases.
- `.py` files used for input generation and testing would need to be replaced with appropriate language-specific versions, in particular to preserve type systems.
- `spyAnalysis.ts`, `spyStatistics.ts`, and `spyTesting.ts` would need to be reworked to connect with your chosen static analysis, code complexity, and code coverage test tools, respectively.
Otherwise, things should work as-is; other extension-related files are more focused on tying those features into the skeleton that is the VSCode API to serve up the outputs of those tools in a reasonable manner.

# Lessons Learned
1. The underlying structure of VSCode (at least, as exposed through it's API) is not IDE-focused but rather view-focused.
    - While not immediately obvious, the API (and what I understand of the extension management and lifecycle management of the program itself) makes it clear that VSCode is more or less just a collection of Electron webviews.
        - Debugging console? That's a browser.
        - Multiple tabs of open text documents? That's one browser per tab *group*, not one browser per tab.
        - Typing changes into one of said text documents? Actually saving a series of changes while showing an unrelated textbox that loaded the contents of that file, and when you save those changes are applied to the underlying file and it just hopes that what you see is still in sync with what's on disk. (`stat` will show a different modification time on disk if it isn't, and it does check for that, thankfully.)
    - VSCode, inherently, doesn't really do anything that makes it an IDE. Instead, most or all of the "IDE-like" qualities that users get from it are from extensions (like **spy**) or built-in extensions (like **github** and **pylance**, which is the default Python language support package).
    - Because VSCode doesn't do anything strictly code-related by itself, if you need to do anything specific you may need to interact with a specific extension. Good news, there's an API for that! Bad news, it only exists if the extension provides that API. Pylance does not.
2. Start with a UI-Event based set of triggers for extension work.
    - As I realized during development and encapsulated as #1 above, VSCode is really just a UI view. Understanding what events you can register listeners for and using that to build and shape the functionality of the extension from the get-go would have saved me some time and probably resulted in a smoother experience. That said, the API is very limited in some ways, so some workarounds (especially regarding what an "open file" or "active text editor" really is) had to be invented.
    - I would love to revisit the concept of workspace changes to avoid having to invalidate some of the UI highlighting that **spy** creates whenever the user starts adding or removing code lines, but that feels a bit like reinventing the wheel of what features an IDE is supposed to provide in the first place.
3. The VSCode Extension Host process
    - Oh boy do I have a lot to say about this. The Extension Host process is a js worker thread started for each IDE extension when its `activate()` trigger is hit, that manages the lifecycle of the extension and anything it says it does to hook into VSCode itself via the API. It does so more or less by turning everything into a `Promise` and if your extension doesn't live up to that promise within the resolution time, you get the boot. That resolution time is either 5 seconds or 1 second, depending on what features you are interacting with, except when it isn't. I detail this a bit further in `src/extension.ts` and in the "VSCode API shuts down with the renderer thread..." point in #4 below. 
    - There are two completely separate versions of this, one for VSCode desktop and one for VSCode browser, and I have not used VSCode browser enough to have a firm understanding of how it works or what I would need to do to work around the filesystem shenanigans going on here to even get Radon and Coverage to run.
    - VSCode uses URIs for file identifiers (almost?) everywhere under the hood, which is great for VSCode browser support, and very annoying when trying to actually use them as file handles in the extension code itself because the VSCode URI library is microscopic.
    - Actually debugging things in the Extension Host process to see what exactly made it unhappy is a pain because it's minified and therefore not human readable by default. Digging around in the source code did shed some light - and also uncovered the lovely comment "Do not be sad".
4. One feature at a time
    - This is a very standard manner of software development, but akin to a LEGO set, building things brick by brick makes results tangible early in the development process.
    - **spy** was developed (mostly) one feature at a time, with each large addition often resulting in restructuring of previous files to better split responsibilities or account for additional conditions. I think this was the right way to go about it because after the first code push or two it kept me focused on what I need to do and how it needs to work with what I already have...
    - ...but could be taken to the next level with "sub-extension" feature registration of parts to `extension.ts`. In my head, some form of dependency injection there is possible and would make multi-language support and adding additional tool/feature integration even easier.
    - The constant shuffling/renaming/reworking of files slowed as the various building blocks fell into place, so I did converge on a more consistent idea of what should go where.
    - This also made it much easier to discover when and where documentation of various things is lacking. Ahem ahem.
        - VSCode API uses `setDecorations()` to set or remove specific formatting to ranges of a document, but can only remove if the formatting you remove is the same *object* that you added, not the same *formatting*.
        - VSCode API shuts down with the renderer thread, not the extension host thread: https://github.com/microsoft/vscode/issues/144118
        - VSCode API can't use it's own icon font (Codicons) as icons in the gutter: https://github.com/microsoft/vscode/issues/143774
        - VSCode gutter has a multitude of other issues stemming from the fact that it was not designed to do anything other than set a breakpoint...I would have liked to make the coverage testing a gutter action, for example: https://github.com/microsoft/vscode/issues/224134
        - **Coverage** API expects to work with configuration files - `Coverage.set_option()` doesn't work for `"report:exclude_also"` without one. Use `Coverage.exclude()` instead. (nobody uses the Coverage API, no discussions found)
        - **PyLint** official documentation suggests the `epylint` module, but it no longer exists: https://github.com/NVIDIA/spark-rapids-ml/pull/457. In fact, all of the PyLint documentation has so much conflicting version information that I opted to use it as a command line tool instead.
5. Writing to Filesystem
    - VSCode API does not provide any good automated terminal interaction, even for the terminals you can create. The `TerminalShellIntegration` is the only set of features that even approaches this, and I found working with it while setting up Radon integration to be such a pain that I opted to read and write **Radon** outputs from/to a file on disk rather than from the shell it's run in because on my personal computer this actually resulted in a noticeable *speedup*. I carried the approach forward to coverage testing as well, and basically all tool integration. **Coverage** is a bit slower and it can happen that **spy** tries to read a coverage report that the operating system has not yet written.
    - This makes **spy** almost impossible to run in VSCode browser, so I didn't attempt that. It also brings up a number of code quality concerns regarding extensions that access the user's filesystem and whether or not, even in the best of scenarios, they can clean up after themselves to avoid polluting things. Unfortunately the answer is no, `extension.ts::deactivate()` and `spy.ts::deleteCache()` will do their best but this is, overall, an issue with the VSCode API workspace, context, and filesystem design. VSCode's built-in "trust" system applies to the source workspace as a whole and not to extensions that try to access it, although the warning banner does clearly state this limitation.
    - I would love an in-memory approach that could solve the file reading/writing, but has flaws of its own (and also feels like reinventing the Operating System) - most notably, keeping all the tool outputs for large projects in memory is potentially a **lot** of RAM dedicated to things you only need to know if one associated file is open. If it's not feasible, there's maybe some improvement to be made by writing files to the extension path rather than to the Radon path or workspace path just to save users some overhead and package everything neatly.
6. Python Coverage testing
    - The initial plan was not to use **Coverage** but rather my own tracer using Python's `marshal` module to examine bytecode. I learned a fair bit about how Python binds to C under the hood in the default implementation (CPython) and I think this approach is absolutely feasible except for one single blocker - a Python code object that represents a callable object is not itself a Callable, and there is no way to convert it into one without effectively implementing a Python VM/interpreter for the bytecode in that code object. There's possibly a feature enhancement PEP to be written for this as it seems like a no-brainer; I'm not aware of one currently existing or previously shot down, nor any reasoning as to why this might not be desirable behaviour (although there are several hundred PEPs and I certainly haven't read them all). Without the ability to easily execute Python as code objects rather than code, I instead offload the work to the tried-and-tested coverage.py module to save time and avoid rewriting Python features.
    - I'd like to integrate this all-input-options testing with VSCode's built-in test support and highlighting so developers using **spy** have a more typical VSCode experience, but the nature of the approach taken here means there are no tests to run - the code itself is the test, and there is no return value to test, only the continued functionality of the code. It's a completely different type of test than what VSCode is designed for and so really doesn't fit well with the testing API. It's a thought to return to as part of better aligning **spy**'s theming and behaviour to what the VSCode ecosystem considers "polite".
7. Type Systems
    - Also part of the initial plan, and very conducive to expanding **spy** to support other languages, is that the extension itself was going to handle "interesting value" generation for interface testing. The git history will show a typescript prototype, which would have been great - except that Python is duck-typed at runtime and there's no way of passing in values from out-of-scope that aren't inherently strings, because all args have to be read from somewhere. (Technically you could do bytes, but the same underlying problem occurs in that you have to determine how to interpret them.) You would need to signal to the test wrapper to interpret some of your "interesting values" as integers, or booleans, or whatever and for languages that do or do not support certain types with certain syntax it becomes impossibly messy very fast. This was made doubly interesting for TypeScript <=> Python interactions where all variable bindings are each implicitly `Any` type by default.
    - Therefore, input generation is now handled in the language of interest to make sure that types are what they are expected to be. Computationally, the approach present in the Python implementation here should work for any language, at least as far as common default/builtin datatypes goes.
8. What's Next?
    1. Lists/tuples/dicts as accepted types for input generation (Python lists mimic arrays in other languages).
    2. Extension Settings for PyLint configuration, to let the user ignore or add rules beyond the default set.
    3. C#Spy, at least to show that it can be done.
    4. Better adherence to themeing and other guidelines for VSCode Extensions to be more ecosystem-friendly.
    5. Publish to marketplace!
