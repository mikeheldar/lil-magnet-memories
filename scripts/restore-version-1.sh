#!/bin/bash

# Restore Site Version 1 Backup
# This script restores the codebase to the state saved in the site-version-1-backup branch

set -e  # Exit on error

BACKUP_BRANCH="site-version-1-backup"
CURRENT_BRANCH=$(git branch --show-current)

echo "=========================================="
echo "Restore Site Version 1 Backup"
echo "=========================================="
echo ""
echo "Current branch: $CURRENT_BRANCH"
echo "Backup branch: $BACKUP_BRANCH"
echo ""

# Check if backup branch exists locally
if ! git show-ref --verify --quiet refs/heads/$BACKUP_BRANCH; then
    echo "⚠️  Backup branch not found locally. Fetching from remote..."
    git fetch origin $BACKUP_BRANCH:$BACKUP_BRANCH 2>/dev/null || {
        echo "❌ Error: Backup branch '$BACKUP_BRANCH' not found locally or remotely."
        echo "   Please ensure the backup branch exists."
        exit 1
    }
fi

# Check if backup branch exists on remote
if git ls-remote --heads origin $BACKUP_BRANCH | grep -q $BACKUP_BRANCH; then
    echo "✓ Backup branch found on remote"
else
    echo "⚠️  Warning: Backup branch not found on remote (only local copy exists)"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes in your working directory."
    echo ""
    read -p "Do you want to proceed? This will discard uncommitted changes. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    echo "Discarding uncommitted changes..."
    git reset --hard HEAD
    git clean -fd
fi

# Ask user what they want to do
echo ""
echo "Choose restore option:"
echo "1) Checkout backup branch directly (switch to backup branch)"
echo "2) Create new branch from backup (recommended - keeps current branch intact)"
echo ""
read -p "Enter choice (1 or 2, default: 2): " choice
choice=${choice:-2}

if [ "$choice" = "1" ]; then
    echo ""
    echo "Switching to backup branch..."
    git checkout $BACKUP_BRANCH
    echo ""
    echo "✓ Successfully switched to $BACKUP_BRANCH"
    echo "   You are now on the backup branch."
elif [ "$choice" = "2" ]; then
    echo ""
    read -p "Enter name for new branch (default: restored-from-version-1): " new_branch
    new_branch=${new_branch:-restored-from-version-1}

    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/$new_branch; then
        echo ""
        read -p "Branch '$new_branch' already exists. Overwrite? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Restore cancelled."
            exit 0
        fi
        git branch -D $new_branch
    fi

    echo "Creating new branch '$new_branch' from backup..."
    git checkout -b $new_branch $BACKUP_BRANCH
    echo ""
    echo "✓ Successfully created branch '$new_branch' from backup"
    echo "   You are now on the restored branch."
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "=========================================="
echo "Restore Complete!"
echo "=========================================="
echo ""
echo "Current commit: $(git log --oneline -1)"
echo ""
echo "To return to your previous branch:"
echo "  git checkout $CURRENT_BRANCH"
echo ""
