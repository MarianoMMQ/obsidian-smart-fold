
**Smart Fold** enables the folding mechanic to work from *anywhere*: it by-passes the requirement of being positioned at a parent-level item in order to fold a list. Instead, with Smart Fold you can activate the folding mechanic even when your cursor is positioned at children-level items. This feature is specially useful to navigate more efficiently large and nested notes.

## 1. Usage demo

```
- Parent
   - Child A { your cursor is positioned here }
   - Child B
```

**Native fold**: If actioned, nothing happens. The folding only works if the line is already marked as *foldable*. This is: the cursor must be on "Parent" in order to fold.

**Smart Fold**: If actioned, it folds the "Parent", hiding both Child A and Child B.  

## 2. Key Features

1. **Fold from unfolded parts**: Unlike the default fold command, Smart Toggle detects whether the current line has children (list items, headings) and folds them even if you’re starting from an unfolded section.
2. **Smart targeting**: If the actionable item has both parent and children items, it will first behave as the native fold command. This is, under this type of setup: 

```
- Parent
   - Sub-parent { your cursor is positioned here }
```

In this case, actioning the Smart Fold hotkey will lead to reveal the child-level item, as in:

```
- Parent
   - Sub-parent
      - Child
```

3. **Parent fold on double‑tap**: Press the hotkey twice in a small window time (default 300ms) to fold one level higher - even if the item has a child. In the last example, hitting the hotkey twice (quickly enough) will lead instead to fold the Parent item. The time window will reset if the parent fold is activated. 

## 3. Settings

* **Parent fold on double‑tap**: (on/off).
* **Double‑tap window**: (time interval in ms).

## 4. Support

If you encounter any issues or have suggestions for new features, file an issue on the GitHub repository.
If you find this plugin helpful for your workflow, I greatly appreciate any additional support through [Ko-fi☕️](https://ko-fi.com/marianomontoya)