# Sympho
🎵 An app to compose, save, edit and play music scores. In addition, you can log in using Google and then store your music sheets in your private and/or public repository.
![](public/icons/readme_3.PNG)

## Tech
### 📦 Prerequisites

- Node 16.13.2 (or higher)
- npm 8.1.2 (or higher)

### 🚀 Getting Started
This project can be executed either with Electron as a desktop app or as a web page using Live Server. Follow these steps to set up and run this project:
1. Clone the code:
```
git clone git@github.com:CosmeValera/Sympho.git
```

2. Open your terminal and navigate to the root directory
```
cd Sympho
```

3. Install the dependencies
```
npm install
```

#### Desktop App (Electron)
4. To run the project with Electron, use the following command*:
```
npm start
```

#### Webpage (Live Server)
4. Alternatively, you can use Live Server to view the project as a web page. If you haven't already installed Live Server globally, you can do so with the following command:
```
npm install -g live-server
```
5. Start Live Server by running:
```
live-server
```

6. Open your web browser and enter the following URL to access the project*:
  
[http://127.0.0.1:8080/public/src/compose/compose.html](http://127.0.0.1:8080/public/src/compose/compose.html)

*Note: Please note that GoogleAuth and Kubernetes functionalities are not available in either option.

---

### Functionalities
- The **composer** window has 3 themes: dark, light and solar:
![](public/icons/readme_1.PNG)
![](public/icons/readme_2.PNG)
![](public/icons/readme_3.PNG)

  - The left bar is the navigation menu where you can move to another window, there are 4: composer, public repository, private repository, account. And you can also change the theme.
  - The top bar is a toolbar that has 2 clearly differentiated parts. In the left part you can choose the note duration and whether it's a rest. In the right part, you can also add accidentals, dots... to the notes you had already put.
  - The right bar has some buttons, I'll proceed to explain them:
    - The play button is used to reproduce the sheet music.
    - The settings button is used to alter the settings of the score: you can change the settings to add a name to the score, change instrument, bpm... 
    ![](public/icons/readme_6.PNG)
    - The right bar also has a save button, with this button you can choose to save the sheet music publicly or privately, if you save it privately it'll be stored just in your private repository. However, if you save it publicly it'll be stored in the public repository AND in the private repository. 
    ![](public/icons/readme_7.PNG)

  - Sheet music example (computer & phone):
  ![](public/icons/readme_4.PNG)
  ![](public/icons/readme_5.PNG)

- This is how the **private repository** looks like (each card has an edit button):
![](public/icons/readme_8-private.PNG)

- This is how the **public repository** looks like, the only difference with the private repository is that each card has a details button and in the private repository it is instead an edit button (you can edit your scores, but you cannot edit another person's score):
![](public/icons/readme_8-public.PNG)

- This is how the **account** window looks like (before and after the login):
![](public/icons/readme_9.PNG)
![](public/icons/readme_10.PNG)

---

### 👥 Contributing
I welcome pull requests! If you're interested in collaborating or improving this project, feel free to fork the repository and submit your changes.
