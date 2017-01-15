    PROGRAM CREATE.JAVASCRIPT
*-------------------------------------------------------
* mvHubOpen, copyright (c) by James F Thompson
* Distributed under an MIT license:
*                     https://opensource.org/licenses/MIT
*
* CREATE.JAVASCRIPT HS.CUSTOMER
*-------------------------------------------------------
    INCLUDE MVHUB.BP MVHUB.MAP.INCLUDE
    EQUATE NOTHING LIT '("")'
*
    LOCATE("/VERBOSE",SEN;BUILD.POS) THEN
        VERBOSE=@TRUE ; SEN=DELETE(SEN,BUILD.POS)
    END ELSE
        VERBOSE=@FALSE
    END
*
    MAP.ID=TRIM(SEN<2>) ; SOURCE.FILENAME=TRIM(SEN<3>)
    DATA.FILENAME=TRIM(SEN<4>)
*
    IF SOURCE.FILENAME="" THEN SOURCE.FILENAME="MVHUB.BP"
    IF DATA.FILENAME="" THEN DATA.FILENAME=MAP.ID
    MAP.ID=UPCASE(MAP.ID)
*
    OPEN "MVHUB.MAP" TO F.MAP ELSE STOPM 'Unable to open "MVHUB.MAP"'
*
    OPEN "MVHUB.MODULE" TO F.MODULE ELSE STOPM "UNABLE TO OPEN MODULE FILE"
    OPEN "MVHUB.MODULE,BASE" TO F.BASE ELSE STOPM "UNABLE TO OPEN MODULE BASE FILE"
    OPEN "MVHUB.JAVASCRIPT" TO F.JAVASCRIPT ELSE STOPM "UNABLE TO OPEN JAVASCRIPT FILE"
*
    READ MAP.REC FROM F.MAP,MAP.ID ELSE
        MAP.REC="" ; BUILD.MAP=@TRUE
    END
    TITLE=MAP.REC<MAP$TITLE>
*
    MAP.VERSION=MAP.REC<MAP$MAP.VERSION> ; WASSOCTYPE=ASSOCTYPES$NODE
    IF MAP.VERSION#"" THEN
        CVERSION=FIELD(MAP.VERSION,"_",1,3)
        XVERSION=FIELD(MAP$VERSION.NUMBER,"_",1,3)
        IF CVERSION#XVERSION THEN
            CRT "Existing Map is incompatible with the version of Create MVHub"
            CRT "  Map Version : ":MAP.VERSION
            CRT "Build Version : ":MAP$VERSION.NUMBER
            STOP
        END
    END
*
    ASSOCIATED.NAME="" ; PAD=SPACE(3)
    WORK.NAME=MAP.ID ; GOSUB BLD.JSON.NAME
    CLASS.ID=JSON.NAME
*
    JS="class ":CLASS.ID:" {"
    JS<-1>=PAD:"var data;"
    JS<-1>=PAD:"constructor(){"
    JS<-1>=PAD:PAD:"data ={} ; "
    JS<-1>=PAD:"}"
    CCNT=DCOUNT(MAP.REC<MAP$BASE+FLD$RECORD>,@VM)
    LAST.WASSOC.ID="!!NEVERMATCHTHIS!!" ; CLOSE.LOOP=@FALSE
    FOR CPOS=1 TO CCNT
        GOSUB SET.WVAR
        BEGIN CASE
            CASE WASSOC.ID=KEY.ASSOC
                GOSUB ADD.BASE.CODE
            CASE WASSOC.ID=BASE.ASSOC
                GOSUB ADD.BASE.CODE
            CASE 1
        END CASE
*
        LAST.WASSOC.ID=WASSOC.ID
    NEXT POS
*
    JS<-1>="}"
*
    JS.ID=DOWNCASE(CLASS.ID):".js"
    WRITE JS ON F.JAVASCRIPT,JS.ID
*
    STOP
*
ADD.BASE.CODE:
*
    BEGIN CASE
        CASE WFLDTYPE=VARTYPE$NUMBER
            ýDEFAULT.VALUE="0"
        CASE WFLDTYPE=VARTYPE$BOOL
            ýDEFAULT.VALUE="false"
        CASE 1
            DEFAULT.VALUE='""'
    END CASE
*
    JS<-1>=@AM:PAD1:"Object.defineProperty(this,'":WNAME:"',{"
    JS<-1>=PAD2:"get: function() { return data.":WNAME:" || "
    JS:=' ':DEFAULT.VALUE:";"
    JS<-1>=PAD2:"}"
*
    JS<-1>=PAD2:"set: function(value){"
    JS<-1>=PAD3:"data.":WNAME:"= value ||"
    JS:=' ':DEFAULT.VALUE:";"
    JS<-1>=PAD2:"}"
    JS<-1>=PAD1:"}"
*
    RETURN
