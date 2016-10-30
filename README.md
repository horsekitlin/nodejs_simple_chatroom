# SocketIO

Extends From [github](https://github.com/aszx87410/nodejs_simple_chatroom)

## Routes

### 建立房間

    route: createroom
    
    params: None

### 使用者加入房間

    route: joinroom

    params: 

        - roomId : String 房間的ID

### 使用者離開房間

    route: leaveroom

    params: 

        - roomId : String 房間的ID

### 發送房間內廣播訊息

    route: localmessage

    params: 

        - roomId : String 房間的ID

        - params : Object 想要廣播的參數

### 發送系統廣播訊息
    
    route: globalmessage

    params:

        - params: Object 想要廣播的參數
        
### 發送私密訊息
