/**
 * CodeNakshatra DSA Engine v1.0
 * Author: Utkarsh Gupta | ABES Engineering College
 *
 * C++ backend engine that performs all DSA operations and
 * returns step-by-step JSON traces for frontend visualization.
 *
 * Compile: g++ -O2 -std=c++17 -o dsa_engine dsa_engine.cpp
 * Usage:   ./dsa_engine <algorithm> <input_json>
 */

#include <iostream>
#include <vector>
#include <stack>
#include <queue>
#include <map>
#include <set>
#include <string>
#include <sstream>
#include <algorithm>
#include <functional>
#include <chrono>
#include <climits>

using namespace std;

// ─── JSON Helper ─────────────────────────────────────────────────────────────

string jsonStr(const string& s) { return "\"" + s + "\""; }
string jsonNum(int n) { return to_string(n); }
string jsonBool(bool b) { return b ? "true" : "false"; }

string vecToJson(const vector<int>& v) {
    string s = "[";
    for (int i = 0; i < (int)v.size(); i++) {
        s += to_string(v[i]);
        if (i + 1 < (int)v.size()) s += ",";
    }
    return s + "]";
}

string vecToJsonHighlight(const vector<int>& v, const set<int>& highlights,
                           const map<int,string>& colors) {
    string s = "[";
    for (int i = 0; i < (int)v.size(); i++) {
        string color = "default";
        if (colors.count(i)) color = colors.at(i);
        else if (highlights.count(i)) color = "highlight";
        s += "{\"val\":" + to_string(v[i]) + ",\"color\":\"" + color + "\"}";
        if (i + 1 < (int)v.size()) s += ",";
    }
    return s + "]";
}

// ─── Step Recorder ───────────────────────────────────────────────────────────

struct Step {
    vector<int> arr;
    map<int,string> colors;  // index → color name
    string description;
    string pseudoLine;
    int comparisons;
    int swaps;
};

vector<Step> steps;
int totalComparisons = 0;
int totalSwaps = 0;

void recordStep(const vector<int>& arr, const map<int,string>& colors,
                const string& desc, const string& pseudo) {
    steps.push_back({arr, colors, desc, pseudo, totalComparisons, totalSwaps});
}

string stepsToJson() {
    string out = "[";
    for (int i = 0; i < (int)steps.size(); i++) {
        const Step& s = steps[i];
        out += "{";
        out += "\"arr\":[";
        for (int j = 0; j < (int)s.arr.size(); j++) {
            string color = "default";
            if (s.colors.count(j)) color = s.colors.at(j);
            out += "{\"val\":" + to_string(s.arr[j]) + ",\"color\":\"" + color + "\"}";
            if (j + 1 < (int)s.arr.size()) out += ",";
        }
        out += "],";
        out += "\"desc\":" + jsonStr(s.description) + ",";
        out += "\"pseudo\":" + jsonStr(s.pseudoLine) + ",";
        out += "\"comparisons\":" + to_string(s.comparisons) + ",";
        out += "\"swaps\":" + to_string(s.swaps);
        out += "}";
        if (i + 1 < (int)steps.size()) out += ",";
    }
    out += "]";
    return out;
}

// ─── BUBBLE SORT ─────────────────────────────────────────────────────────────

void bubbleSort(vector<int> arr) {
    int n = arr.size();
    recordStep(arr, {}, "Starting Bubble Sort — comparing adjacent elements", "bubbleSort(arr)");

    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            totalComparisons++;
            map<int,string> cmp;
            cmp[j] = "comparing";
            cmp[j+1] = "comparing";
            for (int k = n-i; k < n; k++) cmp[k] = "sorted";
            recordStep(arr, cmp,
                "Comparing arr[" + to_string(j) + "]=" + to_string(arr[j]) +
                " with arr[" + to_string(j+1) + "]=" + to_string(arr[j+1]),
                "if arr[j] > arr[j+1]");

            if (arr[j] > arr[j+1]) {
                swap(arr[j], arr[j+1]);
                totalSwaps++;
                map<int,string> swp;
                swp[j] = "swapping";
                swp[j+1] = "swapping";
                for (int k = n-i; k < n; k++) swp[k] = "sorted";
                recordStep(arr, swp,
                    "Swapped! arr[" + to_string(j) + "]=" + to_string(arr[j]) +
                    " ↔ arr[" + to_string(j+1) + "]=" + to_string(arr[j+1]),
                    "swap(arr[j], arr[j+1])");
                swapped = true;
            }
        }
        map<int,string> done;
        for (int k = n-i-1; k < n; k++) done[k] = "sorted";
        recordStep(arr, done, "Pass " + to_string(i+1) + " complete — largest element bubbled to position " + to_string(n-i-1), "// pass complete");
        if (!swapped) {
            map<int,string> all;
            for (int k = 0; k < n; k++) all[k] = "sorted";
            recordStep(arr, all, "Array already sorted — early exit optimization!", "break");
            break;
        }
    }
    map<int,string> fin;
    for (int k = 0; k < n; k++) fin[k] = "sorted";
    recordStep(arr, fin, "✅ Array fully sorted!", "// done");
}

// ─── SELECTION SORT ──────────────────────────────────────────────────────────

void selectionSort(vector<int> arr) {
    int n = arr.size();
    recordStep(arr, {}, "Starting Selection Sort — find minimum and place it", "selectionSort(arr)");

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        map<int,string> c0;
        c0[i] = "pivot";
        for (int k = 0; k < i; k++) c0[k] = "sorted";
        recordStep(arr, c0, "Assuming arr[" + to_string(i) + "]=" + to_string(arr[i]) + " is minimum", "minIdx = i");

        for (int j = i + 1; j < n; j++) {
            totalComparisons++;
            map<int,string> cmp;
            cmp[minIdx] = "pivot";
            cmp[j] = "comparing";
            for (int k = 0; k < i; k++) cmp[k] = "sorted";
            recordStep(arr, cmp,
                "Comparing arr[" + to_string(j) + "]=" + to_string(arr[j]) +
                " with current min arr[" + to_string(minIdx) + "]=" + to_string(arr[minIdx]),
                "if arr[j] < arr[minIdx]");

            if (arr[j] < arr[minIdx]) {
                minIdx = j;
                map<int,string> newMin;
                newMin[minIdx] = "pivot";
                for (int k = 0; k < i; k++) newMin[k] = "sorted";
                recordStep(arr, newMin, "New minimum found: arr[" + to_string(minIdx) + "]=" + to_string(arr[minIdx]), "minIdx = j");
            }
        }

        if (minIdx != i) {
            swap(arr[i], arr[minIdx]);
            totalSwaps++;
            map<int,string> swp;
            swp[i] = "swapping";
            swp[minIdx] = "swapping";
            for (int k = 0; k < i; k++) swp[k] = "sorted";
            recordStep(arr, swp, "Placing minimum at position " + to_string(i), "swap(arr[i], arr[minIdx])");
        }
        map<int,string> done;
        for (int k = 0; k <= i; k++) done[k] = "sorted";
        recordStep(arr, done, "Position " + to_string(i) + " is now correctly placed", "// sorted so far");
    }
    map<int,string> fin;
    for (int k = 0; k < n; k++) fin[k] = "sorted";
    recordStep(arr, fin, "✅ Selection Sort complete!", "// done");
}

// ─── INSERTION SORT ──────────────────────────────────────────────────────────

void insertionSort(vector<int> arr) {
    int n = arr.size();
    recordStep(arr, {}, "Starting Insertion Sort — build sorted portion one element at a time", "insertionSort(arr)");

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        map<int,string> pick;
        pick[i] = "pivot";
        for (int k = 0; k < i; k++) pick[k] = "sorted";
        recordStep(arr, pick, "Picking key = " + to_string(key) + " at position " + to_string(i), "key = arr[i]");

        while (j >= 0 && arr[j] > key) {
            totalComparisons++;
            arr[j + 1] = arr[j];
            totalSwaps++;
            map<int,string> shift;
            shift[j] = "comparing";
            shift[j+1] = "swapping";
            for (int k = 0; k < j; k++) shift[k] = "sorted";
            recordStep(arr, shift, "Shifting arr[" + to_string(j) + "]=" + to_string(arr[j]) + " one position right", "arr[j+1] = arr[j]");
            j--;
        }
        arr[j + 1] = key;
        map<int,string> ins;
        ins[j+1] = "swapping";
        for (int k = 0; k <= i; k++) if (k != j+1) ins[k] = "sorted";
        recordStep(arr, ins, "Inserted key=" + to_string(key) + " at position " + to_string(j+1), "arr[j+1] = key");
    }
    map<int,string> fin;
    for (int k = 0; k < n; k++) fin[k] = "sorted";
    recordStep(arr, fin, "✅ Insertion Sort complete!", "// done");
}

// ─── MERGE SORT ──────────────────────────────────────────────────────────────

void mergeHelper(vector<int>& arr, int l, int r) {
    if (l >= r) return;
    int mid = l + (r - l) / 2;

    map<int,string> div;
    for (int i = l; i <= mid; i++) div[i] = "comparing";
    for (int i = mid+1; i <= r; i++) div[i] = "pivot";
    recordStep(arr, div, "Dividing: left[" + to_string(l) + ".." + to_string(mid) + "] right[" + to_string(mid+1) + ".." + to_string(r) + "]", "mid = (l+r)/2");

    mergeHelper(arr, l, mid);
    mergeHelper(arr, mid + 1, r);

    vector<int> tmp;
    int i = l, j = mid + 1;
    while (i <= mid && j <= r) {
        totalComparisons++;
        map<int,string> cmp;
        cmp[i] = "comparing";
        cmp[j] = "pivot";
        recordStep(arr, cmp, "Comparing " + to_string(arr[i]) + " vs " + to_string(arr[j]), "merge compare");
        if (arr[i] <= arr[j]) tmp.push_back(arr[i++]);
        else tmp.push_back(arr[j++]);
    }
    while (i <= mid) tmp.push_back(arr[i++]);
    while (j <= r)   tmp.push_back(arr[j++]);

    for (int k = l; k <= r; k++) {
        arr[k] = tmp[k - l];
        totalSwaps++;
    }
    map<int,string> merged;
    for (int k = l; k <= r; k++) merged[k] = "sorted";
    recordStep(arr, merged, "Merged segment [" + to_string(l) + ".." + to_string(r) + "]", "// merged");
}

void mergeSort(vector<int> arr) {
    recordStep(arr, {}, "Starting Merge Sort — divide and conquer approach", "mergeSort(arr, 0, n-1)");
    mergeHelper(arr, 0, arr.size() - 1);
    map<int,string> fin;
    for (int k = 0; k < (int)arr.size(); k++) fin[k] = "sorted";
    recordStep(arr, fin, "✅ Merge Sort complete!", "// done");
}

// ─── QUICK SORT ──────────────────────────────────────────────────────────────

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    map<int,string> piv;
    piv[high] = "pivot";
    recordStep(arr, piv, "Pivot chosen: " + to_string(pivot) + " at index " + to_string(high), "pivot = arr[high]");

    for (int j = low; j < high; j++) {
        totalComparisons++;
        map<int,string> cmp;
        cmp[high] = "pivot";
        cmp[j] = "comparing";
        if (i >= low) cmp[i] = "swapping";
        recordStep(arr, cmp, "Comparing arr[" + to_string(j) + "]=" + to_string(arr[j]) + " with pivot=" + to_string(pivot), "if arr[j] <= pivot");

        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
            totalSwaps++;
            map<int,string> swp;
            swp[high] = "pivot";
            swp[i] = "swapping";
            swp[j] = "swapping";
            recordStep(arr, swp, "Swapped arr[" + to_string(i) + "]=" + to_string(arr[i]) + " with arr[" + to_string(j) + "]=" + to_string(arr[j]), "swap(arr[i], arr[j])");
        }
    }
    swap(arr[i + 1], arr[high]);
    totalSwaps++;
    map<int,string> place;
    place[i+1] = "sorted";
    recordStep(arr, place, "Pivot " + to_string(pivot) + " placed at final position " + to_string(i+1), "swap(arr[i+1], arr[high])");
    return i + 1;
}

void quickHelper(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickHelper(arr, low, pi - 1);
        quickHelper(arr, pi + 1, high);
    }
}

void quickSort(vector<int> arr) {
    recordStep(arr, {}, "Starting Quick Sort — partition around pivot", "quickSort(arr, 0, n-1)");
    quickHelper(arr, 0, arr.size() - 1);
    map<int,string> fin;
    for (int k = 0; k < (int)arr.size(); k++) fin[k] = "sorted";
    recordStep(arr, fin, "✅ Quick Sort complete!", "// done");
}

// ─── BINARY SEARCH ───────────────────────────────────────────────────────────

void binarySearch(vector<int> arr, int target) {
    sort(arr.begin(), arr.end());
    recordStep(arr, {}, "Array sorted. Starting Binary Search for target=" + to_string(target), "binarySearch(arr, target)");

    int left = 0, right = arr.size() - 1;
    bool found = false;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        totalComparisons++;
        map<int,string> cmp;
        cmp[mid] = "pivot";
        for (int i = 0; i < left; i++) cmp[i] = "comparing";
        for (int i = right+1; i < (int)arr.size(); i++) cmp[i] = "comparing";
        recordStep(arr, cmp, "mid=" + to_string(mid) + " → arr[mid]=" + to_string(arr[mid]) + " | left=" + to_string(left) + " right=" + to_string(right), "mid = (left+right)/2");

        if (arr[mid] == target) {
            map<int,string> win;
            win[mid] = "sorted";
            recordStep(arr, win, "🎯 Found target=" + to_string(target) + " at index " + to_string(mid) + "!", "return mid");
            found = true;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
            recordStep(arr, cmp, "arr[mid]=" + to_string(arr[mid]) + " < target → search RIGHT half", "left = mid + 1");
        } else {
            right = mid - 1;
            recordStep(arr, cmp, "arr[mid]=" + to_string(arr[mid]) + " > target → search LEFT half", "right = mid - 1");
        }
    }
    if (!found) {
        recordStep(arr, {}, "❌ Target " + to_string(target) + " not found in array", "return -1");
    }
}

// ─── LINKED LIST ─────────────────────────────────────────────────────────────

struct LLStep {
    vector<int> nodes;
    int highlight;
    string desc;
};

void linkedListOps(const vector<int>& vals, const string& op, int opVal) {
    vector<int> list = vals;
    vector<LLStep> llSteps;

    auto recordLL = [&](const vector<int>& l, int h, const string& d) {
        llSteps.push_back({l, h, d});
    };

    recordLL(list, -1, "Initial linked list loaded");

    if (op == "insert_head") {
        list.insert(list.begin(), opVal);
        recordLL(list, 0, "Inserted " + to_string(opVal) + " at HEAD");
    } else if (op == "insert_tail") {
        list.push_back(opVal);
        recordLL(list, list.size()-1, "Inserted " + to_string(opVal) + " at TAIL");
    } else if (op == "delete_head") {
        if (!list.empty()) { list.erase(list.begin()); recordLL(list, -1, "Deleted HEAD node"); }
    } else if (op == "reverse") {
        for (int i = 0; i < (int)list.size()/2; i++) {
            recordLL(list, i, "Pointing at node " + to_string(list[i]));
            swap(list[i], list[list.size()-1-i]);
            recordLL(list, i, "Swapped with tail-side counterpart");
        }
        recordLL(list, -1, "✅ Linked list reversed!");
    } else if (op == "search") {
        for (int i = 0; i < (int)list.size(); i++) {
            recordLL(list, i, "Traversing node " + to_string(list[i]));
            if (list[i] == opVal) { recordLL(list, i, "🎯 Found " + to_string(opVal) + " at index " + to_string(i)); break; }
        }
    }

    // Output JSON
    cout << "{\"type\":\"linkedlist\",\"steps\":[";
    for (int i = 0; i < (int)llSteps.size(); i++) {
        const auto& s = llSteps[i];
        cout << "{\"nodes\":[";
        for (int j = 0; j < (int)s.nodes.size(); j++) {
            cout << "{\"val\":" << s.nodes[j] << ",\"highlight\":" << (j==s.highlight ? "true":"false") << "}";
            if (j+1 < (int)s.nodes.size()) cout << ",";
        }
        cout << "],\"desc\":\"" << s.desc << "\"}";
        if (i+1 < (int)llSteps.size()) cout << ",";
    }
    cout << "]}" << endl;
}

// ─── STACK OPERATIONS ────────────────────────────────────────────────────────

void stackOps(const vector<string>& ops) {
    stack<int> st;
    vector<pair<vector<int>,string>> stSteps;

    auto getStack = [&]() {
        vector<int> v;
        stack<int> tmp = st;
        while (!tmp.empty()) { v.push_back(tmp.top()); tmp.pop(); }
        reverse(v.begin(), v.end());
        return v;
    };

    stSteps.push_back({{}, "Empty stack initialized"});
    for (const string& op : ops) {
        if (op.substr(0,4) == "push") {
            int val = stoi(op.substr(5));
            st.push(val);
            stSteps.push_back({getStack(), "PUSH " + to_string(val) + " → top=" + to_string(st.top())});
        } else if (op == "pop") {
            if (!st.empty()) {
                int val = st.top(); st.pop();
                stSteps.push_back({getStack(), "POP → removed " + to_string(val) + (st.empty() ? " | Stack empty" : " | top=" + to_string(st.top()))});
            }
        } else if (op == "peek") {
            if (!st.empty()) stSteps.push_back({getStack(), "PEEK → top=" + to_string(st.top()) + " (not removed)"});
        }
    }

    cout << "{\"type\":\"stack\",\"steps\":[";
    for (int i = 0; i < (int)stSteps.size(); i++) {
        const auto& [v, d] = stSteps[i];
        cout << "{\"stack\":[";
        for (int j = 0; j < (int)v.size(); j++) {
            cout << v[j];
            if (j+1 < (int)v.size()) cout << ",";
        }
        cout << "],\"desc\":\"" << d << "\"}";
        if (i+1 < (int)stSteps.size()) cout << ",";
    }
    cout << "]}" << endl;
}

// ─── SIMPLE JSON PARSE ───────────────────────────────────────────────────────

vector<int> parseIntArray(const string& s) {
    vector<int> v;
    stringstream ss(s);
    string tok;
    while (getline(ss, tok, ',')) {
        string t = tok;
        t.erase(remove_if(t.begin(), t.end(), [](char c){ return c=='['||c==']'||c==' '; }), t.end());
        if (!t.empty()) v.push_back(stoi(t));
    }
    return v;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

int main(int argc, char* argv[]) {
    if (argc < 3) {
        cout << "{\"error\":\"Usage: dsa_engine <algorithm> <args>\"}" << endl;
        return 1;
    }

    string algo = argv[1];
    string input = argv[2];

    auto start = chrono::high_resolution_clock::now();

    // Sorting algorithms
    if (algo == "bubble" || algo == "selection" || algo == "insertion" ||
        algo == "merge" || algo == "quick") {

        vector<int> arr = parseIntArray(input);
        if (arr.empty() || arr.size() > 20) {
            cout << "{\"error\":\"Array must have 1-20 elements\"}" << endl;
            return 1;
        }

        if      (algo == "bubble")    bubbleSort(arr);
        else if (algo == "selection") selectionSort(arr);
        else if (algo == "insertion") insertionSort(arr);
        else if (algo == "merge")     mergeSort(arr);
        else if (algo == "quick")     quickSort(arr);

        auto end = chrono::high_resolution_clock::now();
        double ms = chrono::duration<double,milli>(end-start).count();

        cout << "{";
        cout << "\"type\":\"sort\",";
        cout << "\"algorithm\":\"" << algo << "\",";
        cout << "\"totalSteps\":" << steps.size() << ",";
        cout << "\"totalComparisons\":" << totalComparisons << ",";
        cout << "\"totalSwaps\":" << totalSwaps << ",";
        cout << "\"timeMs\":" << ms << ",";
        cout << "\"steps\":" << stepsToJson();
        cout << "}" << endl;
    }
    else if (algo == "binary_search") {
        // input: "1,3,5,7,9|5"
        size_t pipe = input.find('|');
        string arrStr = input.substr(0, pipe);
        int target = stoi(input.substr(pipe + 1));
        vector<int> arr = parseIntArray(arrStr);

        binarySearch(arr, target);

        auto end = chrono::high_resolution_clock::now();
        double ms = chrono::duration<double,milli>(end-start).count();

        cout << "{";
        cout << "\"type\":\"search\",";
        cout << "\"algorithm\":\"binary_search\",";
        cout << "\"totalSteps\":" << steps.size() << ",";
        cout << "\"totalComparisons\":" << totalComparisons << ",";
        cout << "\"timeMs\":" << ms << ",";
        cout << "\"steps\":" << stepsToJson();
        cout << "}" << endl;
    }
    else if (algo == "linked_list") {
        // input: "1,2,3,4,5|reverse|0"
        stringstream ss(input);
        string part;
        vector<string> parts;
        while (getline(ss, part, '|')) parts.push_back(part);
        vector<int> nodes = parseIntArray(parts[0]);
        string op = parts.size() > 1 ? parts[1] : "none";
        int val = parts.size() > 2 ? stoi(parts[2]) : 0;
        linkedListOps(nodes, op, val);
    }
    else if (algo == "stack") {
        // input: "push:5,push:3,peek,push:8,pop,pop"
        stringstream ss(input);
        string op;
        vector<string> ops;
        while (getline(ss, op, ',')) ops.push_back(op);
        stackOps(ops);
    }
    else {
        cout << "{\"error\":\"Unknown algorithm: " << algo << "\"}" << endl;
        return 1;
    }

    return 0;
}
